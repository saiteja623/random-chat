import React, { Component } from "react";
import io from "socket.io-client";
import {
  TextField,
  Button,
  Paper,
  Grid,
  Typography,
  Fab,
  Hidden,
  Avatar,
  Dialog,
  DialogContent,
  Divider,
} from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";
import "./css/chat.css";
import GroupIcon from "@material-ui/icons/Group";
import CameraAltIcon from "@material-ui/icons/CameraAlt";
import CloseIcon from "@material-ui/icons/Close";
import AOS from "aos";
import "aos/dist/aos.css";
import Picker from "emoji-picker-react";
import EmojiEmotionsIcon from "@material-ui/icons/EmojiEmotions";
import { withRouter } from "react-router-dom";

class ChatHome extends Component {
  typingTimer = null;
  state = {
    connected: false,
    messages: [],
    activeMsg: "",
    username: "",
    roomId: null,
    connectedTo: "some",
    emojiObj: null,
    emojiPickerOpen: false,
    isOtherTyping: false,
  };

  //to declare  the ref's
  constructor(props) {
    super(props);
    this.chatboxRef = new React.createRef();
    this.audioref = new React.createRef();
  }

  //when component mounts
  componentDidMount = () => {
    this.setState({ username: this.props.username });
    this.socket = io("https://random-chat-by-node.herokuapp.com/"); //https://random-chat-by-node.herokuapp.com/
    var randomNumber = Math.floor(Math.random() * 1000000);
    //emit when a user joins the site
    this.socket.emit("user-joined", {
      name: this.props.username,
      randomNumber: randomNumber,
    });
    //when a user connects to other user
    this.socket.on("connected-to-user", (obj) => {
      var messages = this.state.messages;
      if (obj.firstPerson === this.props.username) {
        var o = {
          msg: "Connected",
          name: obj.secondPerson,
        };
        messages.push(o);
        this.setState({ connectedTo: obj.secondPerson });
      } else {
        var o = {
          msg: "Connected",
          name: obj.firstPerson,
        };
        messages.push(o);
        this.setState({ connectedTo: obj.firstPerson });
      }
      this.setState({ connected: true, messages, roomId: obj.roomId });
    });

    // recieve msgs when other users send message
    this.socket.on("add-message", (msg) => {
      var messages = this.state.messages;
      messages.push({
        name: this.state.connectedTo,
        msg: msg,
      });
      this.setState({ messages });
      this.audioref.current.play();
    });

    //when other user sends image
    this.socket.on("add-image", (data) => {
      var k = {
        name: data.name,
        msg: "image",
        src: data.image,
      };
      var messages = this.state.messages;
      messages.push(k);
      this.setState({ messages });
    });
    //when other user disconnects
    this.socket.on("disconnected", () => {
      if (this.state.connectedTo !== null) {
        var messages = this.state.messages;
        messages.push({
          name: this.state.connectedTo,
          msg: "left",
        });
        this.setState({ messages, connectedTo: null });
      }
    });

    //when other user starts typing
    this.socket.on("is-typing", () => {
      this.setState({ isOtherTyping: true });
      clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => {
        this.setState({ isOtherTyping: false });
      }, 500);
    });
  };

  componentDidUpdate = () => {
    this.scrollIntoViewmsg();
  };

  //disconnect user when pushed to back
  componentWillUnmount = () => {
    this.socket.emit("disconnected-force", this.state.username);
  };
  //send message
  sendMessage = () => {
    if (
      this.state.activeMsg !== "" &&
      this.state.activeMsg.indexOf(" ") !== ""
    ) {
      this.scrollIntoViewmsg();
      var messages = this.state.messages;
      var o = {
        name: "You",
        msg: this.state.activeMsg,
      };
      messages.push(o);
      this.setState({ messages });
      //send the message to the other user
      this.socket.emit("send-message", {
        msg: this.state.activeMsg,
        roomId: this.state.roomId,
      });
      this.setState({ activeMsg: "" });
    }
  };

  //hendle the file changed
  handleImage = (e) => {
    var freader = new FileReader();
    freader.readAsDataURL(e.target.files[0]);
    freader.onload = (event) => {
      this.setState({ src: event.target.result });
      var k = {
        name: "You",
        msg: "image",
        src: event.target.result,
      };
      var messages = this.state.messages;
      messages.push(k);
      this.setState({ messages });
      this.socket.emit("user-image", {
        name: this.props.username,
        image: event.target.result,
      });
    };
  };

  //connect to other user
  connectOtherUser = () => {
    this.setState({ connected: false, connectedTo: "some", messages: [] });
    var randomNumber = Math.floor(Math.random() * 1000000);
    this.socket.emit("user-joined", {
      name: this.props.username,
      randomNumber: randomNumber,
    });
  };

  //send message to other user when typing
  isTyping = (e) => {
    if (e.target.value !== "" && e.target.value.indexOf(" ") !== 0) {
      this.socket.emit("user-typing");
    }
  };

  //add Emoji to the text
  selectEmoji = (e, emojiObj) => {
    var activeMsg = this.state.activeMsg;
    activeMsg = activeMsg + emojiObj.emoji;
    this.setState({ activeMsg });
  };

  //handle emoji picker
  handleEmojiPicker = () => {
    this.setState({ emojiPickerOpen: !this.state.emojiPickerOpen });
  };

  //scroll the msgs list to last message
  scrollIntoViewmsg = () => {
    this.chatboxRef.current.scrollIntoView({ behavior: "smooth" });
  };

  render() {
    return (
      <Paper className="chat-paper" elevation={3}>
        <audio src={require("./alert.mp3")} ref={this.audioref} />
        <Grid
          style={{
            width: "100%",
            height: "100%",
          }}
          direction="column"
        >
          <Grid
            item
            className="chat-nav"
            xs={12}
            style={{ height: "10%", verticalAlign: "middle" }}
          >
            <Typography
              variant="body1"
              align="center"
              style={{
                color: "white",
                paddingTop: "12px",
              }}
            >
              Random Chat
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            style={{
              overflowY: "scroll",
              overflowX: "hidden",
              height: "80%",
              position: "relative",
            }}
          >
            {!this.state.connected && (
              <div style={{ position: "absolute" }} className="waiting-text">
                <Typography variant="body1">
                  Waiting for a stranger to connect
                  <div className="waiting-dots one"></div>
                  <div className="waiting-dots two"></div>
                  <div className="waiting-dots three"></div>
                </Typography>
              </div>
            )}
            {this.state.messages.map((e, index) => {
              if (e.msg === "Connected") {
                return (
                  <div className="joined-msg">
                    {e.msg} to {e.name},say Hi!
                  </div>
                );
              } else if (e.msg === "left") {
                return (
                  <div className="joined-msg">
                    {e.name} has {e.msg}
                  </div>
                );
              } else if (e.msg == "image" && e.name == "You") {
                return (
                  <div className="image-by-admin">
                    <img src={e.src} />
                  </div>
                );
              } else if (e.msg == "image" && e.name != "You") {
                return (
                  <div className="image-by-other">
                    <div className="sender-name">
                      <Typography variant="body2">{e.name}</Typography>{" "}
                    </div>
                    <img src={e.src} />
                  </div>
                );
              } else if (e.name == "You") {
                return (
                  <div className="msg-by-admin">
                    <Typography variant="body2">{e.msg}</Typography>
                  </div>
                );
              } else {
                return (
                  <div className="msg-by-other">
                    <div className="sender-name">
                      <Typography variant="body2">{e.name}</Typography>{" "}
                    </div>

                    <Typography variant="body2">{e.msg}</Typography>
                  </div>
                );
              }
            })}
            {this.state.isOtherTyping && (
              <div className="other-typing">
                <Typography variant="body1">
                  {" "}
                  {this.state.connectedTo} is typing{" "}
                  <div className="dots-anim one"></div>
                  <div className="dots-anim two"></div>
                  <div className="dots-anim three"></div>
                </Typography>
              </div>
            )}
            <div style={{ width: "100%" }} ref={this.chatboxRef}></div>
          </Grid>
          <Grid
            item
            xs={12}
            style={{ height: "12%", padding: "0px 6px", paddingTop: "10px" }}
          >
            {this.state.connectedTo == null ? (
              <Grid item container xs={12} justify="flex-end">
                <Grid item xs={3} sm={2}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      this.props.history.push("/");
                    }}
                  >
                    Home
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    onClick={this.connectOtherUser}
                  >
                    Go to Next stranger
                  </Button>
                </Grid>
              </Grid>
            ) : (
              <Grid
                item
                container
                xs={12}
                justify="space-between"
                alignItems="center"
                spacing={2}
                className="bottom-grid"
              >
                <Grid item xs={1}>
                  <label htmlFor="myInput">
                    <CameraAltIcon
                      style={{
                        color: "white",
                        cursor: "pointer",
                        marginTop: "4px",
                      }}
                      size="small"
                      className="camera-icon"
                    />
                  </label>
                  <input
                    type="file"
                    style={{ display: "none" }}
                    id="myInput"
                    onChange={this.handleImage}
                    accept="image/*"
                  />
                </Grid>
                <Grid item xs={9} style={{ position: "relative" }}>
                  <EmojiEmotionsIcon
                    size="small"
                    className="emoji-icon"
                    style={{ position: "absolute" }}
                    onClick={this.handleEmojiPicker}
                  />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Enter Message.."
                    value={this.state.activeMsg}
                    onChange={(e) => {
                      this.setState({ activeMsg: e.target.value });
                      this.isTyping(e);
                    }}
                    onKeyDown={(e) => {
                      if (e.keyCode == 13) {
                        this.sendMessage();
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={2} sm={2}>
                  <Hidden xsDown>
                    <Button
                      color="primary"
                      size="small"
                      variant="contained"
                      onClick={this.sendMessage}
                    >
                      Send
                    </Button>
                  </Hidden>
                  <Hidden smUp>
                    <Fab
                      size="small"
                      color="primary"
                      style={{ width: "35px", height: "20px" }}
                      onClick={this.sendMessage}
                    >
                      <SendIcon style={{ fontSize: "0.9rem" }} color="white" />
                    </Fab>
                  </Hidden>
                </Grid>
              </Grid>
            )}
          </Grid>
        </Grid>
        <Dialog
          open={this.state.emojiPickerOpen}
          onClose={this.handleEmojiPicker}
        >
          <DialogContent>
            <div className="emoji-picker-div">
              <Picker
                onEmojiClick={this.selectEmoji}
                className="picker"
                style={{ background: "green" }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </Paper>
    );
  }
}

export default withRouter(ChatHome);
