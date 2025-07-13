const fetchUser = async () => {
  try {
    const response = await API.get('/auth/me', { withCredentials: true });
    setUser(response.data.user);
  } catch (err) {
    setUser(null);
  } finally {
    setLoading(false);
    setInitialCheckDone(true);
  }
};

const login = async (credentials) => {
  const res = await API.post('/auth/login', credentials, { withCredentials: true });
  setUser(res.data.user);
};

const register = async (userData) => {
  const res = await API.post('/auth/register', userData, { withCredentials: true });
  setUser(res.data.user);
};
