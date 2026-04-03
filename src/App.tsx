import { z } from "zod";
import { useState } from "react";

const useFormSchema = z.object({
  username: z.string().min(5, "Username is required"),
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
    }),
});
type UserForm = z.infer<typeof useFormSchema>;
export default function Login() {
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const data: UserForm = {
      username,
      password,
    };

    const result = useFormSchema.safeParse(data);

    if (result.success) {
      console.log("Valid data:", result.data);
      // handle password submission
    } else {
      console.log(z.treeifyError(result.error));
      // display errors in UI later
    }
  }
  return (
    <main>
      <h1>Login</h1>
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
        <button type="submit">Log In</button>
      </form>
    </main>
  );
}
