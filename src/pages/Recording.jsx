import React, { useEffect } from "react";
import Appdrawer from "../components/Appdrawer";
import { Button, TextField, Typography, makeStyles } from "@material-ui/core";
import {
  CloudUpload,
  Create,
  CreateRounded,
  Edit,
  EditRounded,
  RecordVoiceOver,
} from "@material-ui/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ReactMic } from "react-mic";
import { useState } from "react";
import { io } from "socket.io-client";
import { ScaleLoader } from "react-spinners";

const useStyles = makeStyles((theme) => {
  return {
    recording: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "auto",
    },
    recorder: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: "2rem",
    },
    btn: {
      width: "fit-content",
      padding: "1rem 3rem",
      fontSize: "1.3rem",
      marginTop: "2rem",
    },
    write: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "3rem",
      [theme.breakpoints.down("sm")]: {
        width: "90vw",
      },
    },
  };
});
function Recording() {
  const classes = useStyles();
  const location = useLocation();
  const [loader, setLoader] = useState(false);
  const [record, setRecord] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [audio, setAudio] = useState(null);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [curriculum, setCurriculum] = useState("");
  const [level, setLevel] = useState("");
  const navigate = useNavigate();
  const [generatedNote, setGeneratedNote] = useState({});
  const user = JSON.parse(localStorage.getItem("user"));
  const [messages, setMessages] = useState([]);
  const isFormValid = subject && topic && curriculum && level;

  const formObj = [
    {
      label: "Subject",
      value: { subject },
    },
    {
      label: "Topic",
      value: { topic },
    },
    {
      label: "Curriculum",
      value: { curriculum },
    },
    {
      label: "Level",
      value: { level },
    },
  ];

  function handleGeneration() {
    fetch(`${process.env.REACT_APP_API_URL}/note`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + user.token,
      },
      body: JSON.stringify({
        subject,
        level,
        curriculum,
        topic,
      }),
    }).then((res) => {
      res.json().then((data) => {
        if (data.status == "success") {
          console.log(data.message);
          setLoader(true);
        }
      });
    });
  }

  function handleFileInputChange(event) {
    const file = event.target.files[0];
    console.log(file);
    setAudio(file);
  }
  console.log(audio);

  function handleUploadGeneration() {
    const formData = new FormData();
    formData.append(
      "audio",
      location.pathname === "/upload" ? audio : recordedAudio
    );
    formData.append("subject", subject);
    formData.append("level", level);
    formData.append("curriculum", curriculum);
    formData.append("topic", topic);
    fetch(`${process.env.REACT_APP_API_URL}/note/audio`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + user.token,
      },
      body: formData,
    }).then((res) => {
      res.json().then((data) => {
        if (data.status == "success") {
          console.log(data.message);
          setLoader(true);
        }
      });
    });
  }

  const authToken = localStorage.getItem("authToken"); // Get the authentication token from local storage
  console.log("authToken: ", authToken); // Log the authentication token to the console

  useEffect(() => {
    const socket = io("https://socket.klassnaut.itcentral.ng/", {
      transports: ["polling"],
      auth: {
        token: authToken,
      },
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      socket.emit("join", { user_id: 1 });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    socket.on("note", (note) => {
      setGeneratedNote(note.note);
      let subjectStorage = JSON.parse(localStorage.getItem("subject"));
      console.log(subjectStorage);
      subjectStorage.push(note.note);
      localStorage.setItem("subject", JSON.stringify(subjectStorage));
      // console.log(note.id);
      // const id = console.log(generatedNote.id);
      setLoader(false);
      navigate("/generator/" + note.note.id);
    });

    socket.on("error", (error) => {
      console.log("Failed to connect to Socket.IO server:", error);
    });

    console.log(messages); // log the messages array
    return () => {
      socket.disconnect();
    };
  }, [authToken, messages]);

  const startRecording = () => {
    setRecord(true);
    setRecordedAudio(null);
  };

  const stopRecording = () => {
    setRecord(false);
  };
  const onStop = (recordedBlob) => {
    const blob = new Blob([recordedBlob.blob], {
      type: recordedBlob.blob.type,
    });
    setRecordedAudio(blob);
    console.log(blob);
  };

  return (
    <div className={classes.recording}>
      <Appdrawer />
      <div className={classes.write}>
        {loader ? (
          <ScaleLoader />
        ) : (
          <form className={classes.form}>
            {formObj.map((form) => {
              return (
                <TextField
                  fullWidth
                  variant="outlined"
                  // value={}
                  onChange={(e) => {
                    if (form.label === "Subject") {
                      setSubject(e.target.value);
                    } else if (form.label === "Topic") {
                      setTopic(e.target.value);
                    } else if (form.label === "Curriculum") {
                      setCurriculum(e.target.value);
                    } else if (form.label === "Level") {
                      setLevel(e.target.value);
                    }
                  }}
                  label={form.label}
                  InputLabelProps={{
                    style: {
                      color: "black",
                    },
                  }}
                  className={classes.input}
                  color="secondary"
                />
              );
            })}
          </form>
        )}
        {location.pathname == "/upload" ? (
          <div className={classes.recorder}>
            {audio && (
              <div>
                <Typography variant="h4" color="secondary">
                  Selected File:
                </Typography>
                <audio controls>
                  <source src={URL.createObjectURL(audio)} />
                </audio>
              </div>
            )}{" "}
            <input
              accept="audio/*"
              style={{ display: "none" }}
              id="file-input"
              type="file"
              onChange={handleFileInputChange}
            />
            <label htmlFor="file-input">
              <Button
                variant="contained"
                color="secondary"
                className={classes.btn}
                component="span"
                startIcon={<CloudUpload />}
              >
                Upload Audio
              </Button>
            </label>
          </div>
        ) : location.pathname === "/record" ? (
          <div>
            <ReactMic record={record} className="sound-wave" onStop={onStop} />
            <div className={classes.recorder}>
              <Button
                variant="contained"
                className={classes.btn}
                color="secondary"
                onClick={startRecording}
                startIcon={<RecordVoiceOver />}
              >
                Start Recording
              </Button>
              <Button
                variant="contained"
                className={classes.btn}
                color="secondary"
                onClick={stopRecording}
                startIcon={<RecordVoiceOver />}
              >
                Stop Recording
              </Button>
              {recordedAudio && (
                <audio controls>
                  <source src={URL.createObjectURL(recordedAudio)} />
                </audio>
              )}{" "}
            </div>
          </div>
        ) : null}
        ;
        {loader ? (
          <Button
            variant="contained"
            className={classes.btn}
            color="secondary"
            startIcon={<EditRounded />}
            onClick={handleGeneration}
            disabled
          >
            Generating Note ...
          </Button>
        ) : (
          <Button
            variant="contained"
            className={classes.btn}
            color="secondary"
            disabled={!isFormValid}
            startIcon={<EditRounded />}
            onClick={
              location.pathname === "/write"
                ? handleGeneration
                : location.pathname === "/upload"
                ? handleUploadGeneration
                : location.pathname === "/record"
                ? handleUploadGeneration
                : null
            }
          >
            Generate Note
          </Button>
        )}
      </div>
    </div>
  );
}

export default Recording;
