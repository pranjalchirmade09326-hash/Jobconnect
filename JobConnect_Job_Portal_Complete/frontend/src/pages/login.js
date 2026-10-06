import api from "../api/axios";
const response = await api.post("/auth/login", {
    email,
    password
});