import React, { useState } from "react";
import moment from "moment";
import GoogleContacts from "./GoogleContacts";
import GoogleCalendar from "./GoogleCalendar";
import Loader from "./Loader";

import "./App.css";

const request = async (link, options) => {
  let data = await fetch(`${link}`, options);
  return data;
};

function App() {
  const headers = new Headers();
  const [contacts, setContacts] = useState(null);
  const [events, setEvents] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setLoading] = useState(false);
  headers.append("Content-Type", "application/atom+xml");
  headers.append("GData-Version", "3.0");
  headers.append("Authorization", `Bearer ${accessToken}`);
  headers.append("If-Match", "*");

  const responseCallback = (response) => {
    setLoading(false);
    if (response && response.length > 0) {
      setContacts(response);
    }
  };

  const editContact = async (link) => {
    setLoading(true);
    let res = await request(link, {
      method: "GET",
      headers: headers,
    });
    let xml = await res.text();

    let matched = "";
    let newXml;
    let c = xml.indexOf("</entry>");
    let x = xml.indexOf("AosId");

    if (c >= 0) {
      if (x > 0) {
        let strStart = "<gContact:userDefinedField key='AosId' value='";
        let strFinish = "'/>";
        let value = xml.match(strStart + "(.*?)" + strFinish)[1];
        newXml = xml.replace(
          strStart + value + strFinish,
          "<gContact:userDefinedField key='AosId' value='101'/>"
        );
      } else {
        matched = xml.substring(0, c);
        newXml = matched.concat(
          `<gContact:userDefinedField key='AosId' value='1255'/></entry>`
        );
      }
      await request(link, {
        method: "PUT",
        headers: headers,
        body: newXml,
      });
    }
    setLoading(false);
    alert("Updated");
  };

  const updateAllContacts = async () => {
    setLoading(true);
    const links = contacts.map((contact) => contact.editLink);
    const fetchArray = [];

    for (let i = 0; i < links.length; i++) {
      fetchArray.push(
        await fetch(`${links[i]}`, {
          method: "GET",
          headers: headers,
        })
      );
    }

    let responses = await Promise.all(fetchArray);
    let xmls = [];
    for (let i = 0; i < responses.length; i++) {
      xmls.push(await responses[i].text());
    }

    let updateRequests = [];

    for (let i = 0; i < xmls.length; i++) {
      let matched = "";
      let newXml;
      let c = xmls[i].indexOf("</entry>");
      let x = xmls[i].indexOf("AosId");
      if (c >= 0) {
        if (x > 0) {
          let strStart = "<gContact:userDefinedField key='AosId' value='";
          let strFinish = "'/>";
          let value = xmls[i].match(strStart + "(.*?)" + strFinish)[1];
          newXml = xmls[i].replace(
            strStart + value + strFinish,
            "<gContact:userDefinedField key='AosId' value='500'/>"
          );
        } else {
          matched = xmls[i].substring(0, c);
          newXml = matched.concat(
            `<gContact:userDefinedField key='AosId' value='10'/></entry>`
          );
        }
        updateRequests.push(
          await request(links[i], {
            method: "PUT",
            headers: headers,
            body: newXml,
          })
        );
      }
    }

    await Promise.all(updateRequests);
    setLoading(false);
    alert("updated");
  };

  const responseCallbackEvent = (response) => {
    setLoading(false);
    setEvents(response);
  };

  const editEvent = (event) => {
    var myHeaders = new Headers({
      "Content-Type": "application/json",
      "GData-Version": "3.0",
      Authorization: `Bearer ${accessToken}`,
    });

    request(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`,
      {
        method: "PATCH",
        headers: myHeaders,
        credentials: "include",
        body: JSON.stringify({
          id: event.id,
          extendedProperties: {
            private: {
              aosId: "105",
              age: "12"
            },
          },
        }),
      }
    );
  };
  return (
    <div style={{ padding: 25 }}>
      <Loader isLoading={isLoading}>
        <GoogleContacts
          clientId="275879866675-dq1erjebbk3qur66cbtvpgm1abnmnu04.apps.googleusercontent.com"
          buttonText="Import Google Contacts"
          onSuccess={responseCallback}
          onFailure={responseCallback}
          setAccessToken={setAccessToken}
          setLoading={setLoading}
        />
        <GoogleCalendar
          clientId="275879866675-dq1erjebbk3qur66cbtvpgm1abnmnu04.apps.googleusercontent.com"
          buttonText="Import Calendar Events"
          onSuccess={responseCallbackEvent}
          onFailure={responseCallbackEvent}
          setAccessToken={setAccessToken}
          setLoading={setLoading}
        />
        {contacts && contacts.length > 0 && (
          <button onClick={updateAllContacts} style={{ margin: 10 }}>
            Update all contacts
          </button>
        )}
        {contacts && contacts.length > 0 && (
          <table style={{ margin: 10 }}>
            <tbody>
              <tr>
                <th>No</th>
                <th>Title</th>
                <th>Email</th>
                <th>Phone</th>
                <th>AosId</th>
                <th>Edit</th>
              </tr>
              {contacts.map((contact, i) => (
                <tr key={i}>
                  <td>Contact {i}</td>
                  <td>{contact.title}</td>
                  <td>{contact.email}</td>
                  <td>{contact.phoneNumber}</td>
                  <td>{contact.aosId}</td>
                  <td>
                    <button onClick={() => editContact(contact.editLink)}>
                      Edit Contact
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {events && events.length > 0 && (
          <table style={{ margin: 10 }}>
            <tbody>
              <tr>
                <th>No</th>
                <th>Reason</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Extended Properties</th>
                <th>Edit</th>
              </tr>
              {events.map((event, i) => (
                <tr key={event.id}>
                  <td style={{ textAlign: "center" }}>Event {i}</td>
                  <td style={{ textAlign: "center" }}>{event.summary}</td>
                  <td style={{ textAlign: "center" }}>
                    {moment(event.start.dateTime).format("YYYY-MM-DD")}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {moment(event.end.dateTime).format("YYYY-MM-DD")}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {event &&
                      event.extendedProperties &&
                      event.extendedProperties.private &&
                      event.extendedProperties.private.aosId}
                  </td>
                  <td>
                    <button onClick={() => editEvent(event)}>Edit Event</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Loader>
    </div>
  );
}

export default App;
