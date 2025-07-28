// src/pages/Signup.jsx
import React, { useState } from "react";
import { useAuth }        from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const { signup }              = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signup(email, password);
      navigate("/");  // go to dashboard
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-2xl mb-4">Sign Up for EchoWrite</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"
        >
          Sign Up
        </button>
      </form>
      <p className="mt-4 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-indigo-600 hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
