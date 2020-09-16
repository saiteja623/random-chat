import React, { Component } from "react";
import { Paper, TextField, Button, Grid, Typography } from "@material-ui/core";
import "./css/chat.css";
import { withRouter } from "react-router-dom";

class Form extends Component {
  state = {
    username: "",
  };
  render() {
    return (
      <Paper className="form-paper">
        <Typography variant="h6" gutterBottom align="center">
          Chat with random strangers
        </Typography>
        <Typography variant="body2" component="p" gutterBottom>
          Welcome to the Quickchatzz free Chat Roulette.You Must be 13+ to start
          a random chat with stranger.
          <br />
          How to chat with strangers safely?
          <br />
          Don't share your personal information or contacts,don't send any money
          to strangers.
          <br />
          Enjoy the Quickchatzz!
          <br />
        </Typography>
        <Grid
          container
          justify="space-between"
          alignItems="center"
          style={{ marginTop: "20px" }}
        >
          <Grid item xs={9}>
            <TextField
              variant="outlined"
              label="Username"
              size="small"
              style={{ width: "100%" }}
              onChange={(e) => {
                this.setState({ username: e.target.value });
                this.props.setUsername(e.target.value);
              }}
              onKeyDown={(e) => {
                if (
                  e.keyCode == 13 &&
                  this.state.username !== "" &&
                  this.state.username.indexOf(" ") !== 0
                ) {
                  this.props.history.push("/room");
                }
              }}
            />
          </Grid>
          <Grid item xs={3} sm={2}>
            <Button
              color="primary"
              variant="contained"
              size="small"
              disabled={
                this.state.username == "" ||
                this.state.username.indexOf(" ") === 0
              }
              onClick={() => {
                this.props.history.push("/room");
              }}
            >
              start
            </Button>
          </Grid>
        </Grid>
      </Paper>
    );
  }
}

export default withRouter(Form);
