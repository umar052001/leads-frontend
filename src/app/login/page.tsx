"use client";
import { signIn, getSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react"; // npm install lucide-react if missing

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSession().then((session) => {
      if (session) router.push("/dashboard");
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid email or password. Please try again."); // Match design
    } else if (res?.ok) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      {" "}
      {/* Dark bg */}
      <Card className="w-[400px] bg-gray-900 border-gray-700">
        {" "}
        {/* Dark card */}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2 mb-2">
            <Image
              src="/imagini.jpeg" // Path relative to /public
              alt="Imagini Logo"
              width={70}
              height={40}
              className="w-20 h-20"
            />
          </CardTitle>
          <CardDescription className="text-gray-400">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Input
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={error ? "border-red-500 focus:border-red-500" : ""} // Red on error
              />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={
                    error
                      ? "border-red-500 focus:border-red-500 pr-10"
                      : "pr-10"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}{" "}
              {/* Red error */}
            </div>
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Sign In
            </Button>
          </form>
          <Button
            variant="link"
            className="w-full text-green-500 hover:text-green-400 justify-start p-0 h-auto"
          >
            Forgot Password?
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
