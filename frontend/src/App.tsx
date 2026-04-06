import { z } from "zod";
import filter from "leo-profanity";
import { useState } from "react";

const useFormSchema = z.object({
  username: z
    .string()
    .min(5, "Username has to be at least 5 characters long!")
    .refine((val) => !filter.check(val), {
      message: "Username contains inappropriate language",
    }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(20, { message: "Password cannot exceed 20 characters" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Password must contain at least one special character",
    })
    .refine((val) => !filter.check(val), {
      message: "Password contains inappropriate language",
    }),
});
type UserForm = z.infer<typeof useFormSchema>;
export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameError, setUsernameError] = useState("" as string | undefined);
  const [passwordError, setPasswordError] = useState("" as string | undefined);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const data: UserForm = {
      username,
      password,
    };

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    const result = useFormSchema.safeParse(data);

    if (result.success) {
      const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      setUsernameError(JSON.stringify(data));
    } else {
      setUsernameError(
        z.treeifyError(result.error).properties?.username?.errors[0],
      );
      setPasswordError(
        z.treeifyError(result.error).properties?.password?.errors[0],
      );
    }
  }
  return (
    <main>
      <h1>Register New Account</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Username:</label>
        <input
          type="text"
          id="username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <label htmlFor="confirmPassword">Confirm Password:</label>
        <input
          type="password"
          id="confirmPassword"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button type="submit">Register</button>
      </form>
      {usernameError ? (
        <p style={{ color: "red" }}>{usernameError}</p>
      ) : (
        passwordError && <p style={{ color: "red" }}>{passwordError}</p>
      )}
    </main>
  );
}
