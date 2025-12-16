import { makeAutoObservable } from "mobx";
import { jwtDecode } from "jwt-decode";
import { api } from "../api/axios.js";

export default class AuthStore {
  token = localStorage.getItem("token") || null;
  role = null; // "ADMIN" | "MANAGER" | "USER"
  email = null;

  constructor() {
    makeAutoObservable(this);
    if (this.token) {
      this.applyToken(this.token);
    }
  }

  applyToken(token) {
    this.token = token;
    localStorage.setItem("token", token);

    const payload = jwtDecode(token);
    // subject = email (ты делаешь subject = userDetails.getUsername() -> email)
    this.email = payload.sub || null;

    // role claim: "ROLE_ADMIN" etc.
    const rawRole = payload.role || null;
    this.role = rawRole?.startsWith("ROLE_") ? rawRole.replace("ROLE_", "") : rawRole;
  }

  get isAuth() {
    return !!this.token;
  }

  async login(email, password) {
    const res = await api.post("/api/v1/auth/sign-in", { email, password });
    this.applyToken(res.data.token);
  }

  async register(username, email, password) {
    const res = await api.post("/api/v1/auth/sign-up", { username, email, password });
    this.applyToken(res.data.token);
  }

  logout() {
    this.token = null;
    this.role = null;
    this.email = null;
    localStorage.removeItem("token");
  }
}
