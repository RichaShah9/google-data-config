import React, { useEffect } from "react";
import PropTypes from "prop-types";
import xml from "xml-js";

import {
  extractTitleFromEntry,
  extractEmailFromEntry,
  extractPhoneNumberFromEntry,
} from "./utils";

const SCOPE = "https://www.googleapis.com/auth/contacts";
const MAX_RESULTS = "999";

function GoogleContacts(props) {
  useEffect(() => {
    const { jsSrc } = props;
    ((d, s, id, cb) => {
      const element = d.getElementsByTagName(s)[0];
      const fjs = element;
      let js = element;
      js = d.createElement(s);
      js.id = id;
      js.src = jsSrc;
      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      } else {
        d.head.appendChild(js);
      }
      js.onload = cb;
    })(document, "script", "google-contacts");
  });

  const handleImportContacts = (res) => {
    const { onFailure, setAccessToken, setLoading } = props;
    setLoading(true);
    if (res) {
      const authResponse = res.getAuthResponse();
      setAccessToken(authResponse.access_token);
      window.gapi.load("client", () => {
        window.gapi.client
          .request({
            path: "/m8/feeds/contacts/default/full",
            params: { "max-results": MAX_RESULTS },
            headers: {
              "GData-Version": "3.0",
              Authorization: `Bearer ${authResponse.access_token}`,
            },
          })
          .then(
            (response) => handleParseContacts(response),
            (err) => onFailure(err)
          );
      });
    }
  };

  const handleParseContacts = (response) => {
    const { onSuccess } = props;

    const options = {
      ignoreDeclaration: true,
      ignoreComment: true,
      compact: true,
    };
    const parsed = xml.xml2js(response.body, options);

    const results = [];

    Object.keys(parsed.feed.entry).forEach((key) => {
      let customFields = parsed.feed.entry[key]["gContact:userDefinedField"];
      let age, aosId;
      if (
        parsed.feed.entry[key] &&
        parsed.feed.entry[key]["gd:email"] &&
        parsed.feed.entry[key]["gd:email"]._attributes &&
        parsed.feed.entry[key]["gd:email"]._attributes.address
      ) {
        if (customFields && customFields.length > 0) {
          Object.keys(customFields).forEach((field) => {
            if (customFields[field]._attributes.key === "Age") {
              age = customFields[field]._attributes.value;
            }
            if (customFields[field]._attributes.key === "AosId") {
              aosId = customFields[field]._attributes.value;
            }
          });
        }
        results.push({
          title: extractTitleFromEntry(parsed.feed.entry[key]),
          email: extractEmailFromEntry(parsed.feed.entry[key]),
          phoneNumber: extractPhoneNumberFromEntry(parsed.feed.entry[key]),
          editLink: parsed.feed.entry[key].link.find(
            (l) => l._attributes.rel === "edit"
          )._attributes.href,
          age,
          aosId,
        });
      }
    });

    onSuccess(results);
  };

  const signIn = (e) => {
    const {
      clientId,
      cookiePolicy,
      loginHint,
      hostedDomain,
      redirectUri,
      discoveryDocs,
      onRequest,
      onFailure,
      uxMode,
      accessType,
      responseType,
      prompt,
      onSuccess,
    } = props;

    const params = {
      client_id: clientId,
      cookie_policy: cookiePolicy,
      login_hint: loginHint,
      hosted_domain: hostedDomain,
      discoveryDocs,
      ux_mode: uxMode,
      redirect_uri: redirectUri,
      scope: SCOPE,
      access_type: accessType,
    };

    if (responseType === "code") {
      params.access_type = "offline";
    }

    if (e) {
      e.preventDefault();
    }
    const _signIn = () => {
      const auth2 = window.gapi.auth2.getAuthInstance();
      const options = { prompt };
      onRequest();
      if (responseType === "code") {
        auth2.grantOfflineAccess(options).then(
          (res) => onSuccess(res),
          (err) => onFailure(err)
        );
      } else {
        auth2.signIn(options).then(
          (res) => handleImportContacts(res),
          (err) => onFailure(err)
        );
      }
    };

    window.gapi.load("auth2", () => {
      if (!window.gapi.auth2.getAuthInstance()) {
        window.gapi.auth2.init(params).then(_signIn);
      } else {
        _signIn();
      }
    });
  };

  const { render } = props;

  if (render) {
    return render({ onClick: signIn });
  }

  return (
    <React.Fragment>
      <button style={{ margin: 10 }} onClick={signIn}>
        {props.buttonText}
      </button>
    </React.Fragment>
  );
}

GoogleContacts.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onFailure: PropTypes.func.isRequired,
  clientId: PropTypes.string.isRequired,
  jsSrc: PropTypes.string,
  onRequest: PropTypes.func,
  buttonText: PropTypes.node,
};

GoogleContacts.defaultProps = {
  onRequest: () => {},
  jsSrc: "https://apis.google.com/js/api.js",
};

export default GoogleContacts;
