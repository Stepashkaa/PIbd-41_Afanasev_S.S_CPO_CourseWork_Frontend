import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import StoreContext from "../../../stores/StoreContext.js";
import AuthStore from "../../../stores/AuthStore.js";
import LoginPage from "../LoginPage.jsx";
import RegisterPage from "../RegisterPage.jsx";

// ✅ мок api.post
vi.mock("../../../api/axios.js", () => ({
  api: {
    post: vi.fn(),
  },
}));

// ✅ мок jwtDecode
vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

// ✅ мок navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { api } from "../../../api/axios.js";
import { jwtDecode } from "jwt-decode";

function renderWithStore(ui, { store, route = "/" } = {}) {
  return render(
    <StoreContext.Provider value={{ store }}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </StoreContext.Provider>
  );
}

// Хелпер: твои инпуты не связаны с label (нет htmlFor/id),
// поэтому getByLabelText не сработает. Берём по name.
function getInput(container, name) {
  const el = container.querySelector(`input[name="${name}"]`);
  if (!el) throw new Error(`Не найден input[name="${name}"]`);
  return el;
}

describe("Auth pages (Login/Register)", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("LoginPage: успешный вход -> дергает api.post, кладет token, выставляет роль/почту и navigate('/')", async () => {
    const user = userEvent.setup();
    const token = "fake.jwt.token";

    api.post.mockResolvedValueOnce({ data: { token } });
    jwtDecode.mockReturnValueOnce({ sub: "m1@test.com", role: "ROLE_MANAGER" });

    const store = { auth: new AuthStore() };

    const { container } = renderWithStore(<LoginPage />, {
      store,
      route: "/login",
    });

    await user.type(getInput(container, "email"), "m1@test.com");
    await user.type(getInput(container, "password"), "Pa$sw0rd!");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/v1/auth/sign-in", {
        email: "m1@test.com",
        password: "Pa$sw0rd!",
      });
    });

    expect(store.auth.token).toBe(token);
    expect(store.auth.email).toBe("m1@test.com");
    expect(store.auth.role).toBe("MANAGER");
    expect(store.auth.isAuth).toBe(true);

    expect(localStorage.getItem("token")).toBe(token);
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("LoginPage: ошибка входа -> показывает backend message", async () => {
    const user = userEvent.setup();

    api.post.mockRejectedValueOnce({
      response: { data: { message: "Неверный пароль" } },
    });

    const store = { auth: new AuthStore() };

    const { container } = renderWithStore(<LoginPage />, {
      store,
      route: "/login",
    });

    await user.type(getInput(container, "email"), "m1@test.com");
    await user.type(getInput(container, "password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByText("Неверный пароль")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(store.auth.isAuth).toBe(false);
  });

  it("RegisterPage: успешная регистрация -> дергает api.post, кладет token и navigate('/')", async () => {
    const user = userEvent.setup();
    const token = "reg.jwt.token";

    api.post.mockResolvedValueOnce({ data: { token } });
    jwtDecode.mockReturnValueOnce({ sub: "u@test.com", role: "ROLE_USER" });

    const store = { auth: new AuthStore() };

    const { container } = renderWithStore(<RegisterPage />, {
      store,
      route: "/register",
    });

    await user.type(getInput(container, "username"), "user_123");
    await user.type(getInput(container, "email"), "u@test.com");
    await user.type(getInput(container, "password"), "Pa$sw0rd!");
    await user.click(screen.getByRole("button", { name: "Создать аккаунт" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/v1/auth/sign-up", {
        username: "user_123",
        email: "u@test.com",
        password: "Pa$sw0rd!",
      });
    });

    expect(store.auth.token).toBe(token);
    expect(store.auth.email).toBe("u@test.com");
    expect(store.auth.role).toBe("USER");
    expect(localStorage.getItem("token")).toBe(token);

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("AuthStore: logout очищает token/role/email и localStorage", () => {
    // Важно: если перед созданием AuthStore в localStorage есть token,
    // он вызовет applyToken -> jwtDecode должен вернуть payload.
    localStorage.setItem("token", "any.jwt.token");
    jwtDecode.mockReturnValueOnce({ sub: "m1@test.com", role: "ROLE_MANAGER" });

    const s = new AuthStore();

    // sanity-check, что applyToken отработал
    expect(s.isAuth).toBe(true);
    expect(s.email).toBe("m1@test.com");
    expect(s.role).toBe("MANAGER");

    s.logout();

    expect(s.token).toBeNull();
    expect(s.role).toBeNull();
    expect(s.email).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
