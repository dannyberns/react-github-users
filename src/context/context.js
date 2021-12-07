import React, { useState, useEffect, useContext } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const AppContext = React.createContext();

const AppProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  // request loading
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });

  const fetchUser = async user => {
    toggleError();
    setIsLoading(true);
    try {
      const response = await axios.get(`${rootUrl}/users/${user}`);
      setGithubUser(response.data);
      // get the repos from the user
      const { login, followers_url } = response.data;
      // get user repos and followers and than pass data together, better than individually getting 2 axios requests
      const [repos, followers] = await Promise.allSettled([
        axios.get(
          `${rootUrl}/users/${login}/repos?per_page=100`,
          axios.get(`${followers_url}?per_page=100`)
        ),
        axios.get(`${followers_url}?per_page=100`)
      ]);

      if (repos.status === "fulfilled") setRepos(repos.value.data);
      if (followers.status === "fulfilled") setFollowers(followers.value.data);
    } catch (error) {
      toggleError(true, "there is no user with that username");
    }
    checkRequests();
    setIsLoading(false);
  };

  const checkRequests = async () => {
    try {
      const data = await axios.get(`${rootUrl}/rate_limit`);
      const {
        data: {
          rate: { remaining }
        }
      } = data;
      setRequests(remaining);
      if (remaining === 0) {
        toggleError(true, "sorry, you have exceeded your hourly rate limit!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };

  useEffect(() => {
    checkRequests();
  }, []);

  return (
    <AppContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        fetchUser,
        isLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useGlobalContext = () => {
  return useContext(AppContext);
};

export { AppProvider };
