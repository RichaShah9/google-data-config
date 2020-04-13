import React from "react";
import PropTypes from "prop-types";

const SCOPE = "https://www.googleapis.com/auth/calendar.events";

const request = async (link, options) => {
  let data = await fetch(`${link}`, options);
  return data;
};

function GoogleCalendar(props) {
  const handleImportCalendarEvents = async (res) => {
    if (res) {
      props.setLoading(true);
      const { onSuccess, setAccessToken } = props;
      const authResponse = res.getAuthResponse();
      setAccessToken(authResponse.access_token);
      const headers = new Headers();
      headers.append("GData-Version", "3.0");
      headers.append("Authorization", `Bearer ${authResponse.access_token}`);
      let response = await request(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
        {
          method: "GET",
          headers: headers,
        }
      );
      let events = await response.json();
      if (events && events.length < 0) return;
      onSuccess(events.items);
    }
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
      prompt,
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

    if (e) {
      e.preventDefault();
    }
    const _signIn = () => {
      const auth2 = window.gapi.auth2.getAuthInstance();
      const options = { prompt };
      onRequest();
      auth2.signIn(options).then(
        (res) => handleImportCalendarEvents(res),
        (err) => onFailure(err)
      );
    };

    window.gapi.load("auth2", () => {
      if (!window.gapi.auth2.getAuthInstance()) {
        window.gapi.auth2.init(params).then(_signIn);
      } else {
        _signIn();
      }
    });
  };

  return (
    <React.Fragment>
      <button style={{ margin: 10 }} onClick={signIn}>
        {props.buttonText}
      </button>
    </React.Fragment>
  );
}

GoogleCalendar.propTypes = {
  clientId: PropTypes.string.isRequired,
  jsSrc: PropTypes.string,
  onRequest: PropTypes.func,
  buttonText: PropTypes.node,
};

GoogleCalendar.defaultProps = {
  onRequest: () => {},
  jsSrc: "https://apis.google.com/js/api.js",
};

export default GoogleCalendar;
