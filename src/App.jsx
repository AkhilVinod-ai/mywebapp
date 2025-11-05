import { useState, useEffect } from "react";
import {
  Button,
  Heading,
  Flex,
  View,
  Grid,
  Divider,
  Text,
} from "@aws-amplify/ui-react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
import "./App.css";

Amplify.configure(outputs);

const client = generateClient({
  authMode: "userPool",
});

export default function App() {
  const [userprofiles, setUserProfiles] = useState([]);
  const { signOut, user } = useAuthenticator((context) => [context.user]);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    fetchUserProfile();
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchUserProfile() {
    try {
      const { data: profiles } = await client.models.UserProfile.list();
      setUserProfiles(profiles);
    } catch (err) {
      console.error("Error fetching profiles:", err);
    }
  }

  return (
    <div className="cyber-bg">
      <div className="cyber-overlay"></div>
      <Flex
        className="App"
        justifyContent="center"
        alignItems="center"
        direction="column"
        width="80%"
        margin="0 auto"
        minHeight="100vh"
      >
        <div className="header">
          <Heading level={2} className="title-glow">
            👾 Cyber Profile Portal
          </Heading>
          <Text className="clock">{time}</Text>
        </div>

        <Divider />

        <Grid
          margin="3rem 0"
          autoFlow="column"
          justifyContent="center"
          gap="2rem"
          alignContent="center"
          wrap="wrap"
        >
          {userprofiles.map((userprofile) => (
            <Flex
              key={userprofile.id || userprofile.email}
              direction="column"
              justifyContent="center"
              alignItems="center"
              gap="1rem"
              className="cyber-box"
            >
              <View>
                <Heading level={4}>{userprofile.email}</Heading>
              </View>
            </Flex>
          ))}
        </Grid>

        <Button className="signout-btn" onClick={signOut}>
          Sign Out
        </Button>
      </Flex>
    </div>
  );
}