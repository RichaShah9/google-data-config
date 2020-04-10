import React, { Component } from "react";
import "./Loader.css";

class Loader extends Component {
  render() {
    const { isLoading } = this.props;
    return (
      <div className="loading-container">
        {isLoading && (
          <div className="loading-div">
            <div className="lds-default">
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
            </div>
          </div>
        )}
        {this.props.children}
      </div>
    );
  }
}

export default Loader;
