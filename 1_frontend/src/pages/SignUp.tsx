import { supabase } from "../app/supabaseClient";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function SignUp() {
  const [email,setEmail]=useState(""); const [pw,setPw]=useState("");
  const nav = useNavigate();
  const submit = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) return alert(error.message);
    nav("/app");
  };
  return (
    <div className="h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-bold">Đăng ký</h1>
        <input className="border p-2 w-full" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border p-2 w-full" placeholder="Mật khẩu" type="password" value={pw} onChange={e=>setPw(e.target.value)} />
        <button className="bg-black text-white w-full py-2" onClick={submit}>Đăng nhập</button>
        <p className="text-sm">Chưa có tài khoản? <Link to="/signup" className="underline">Đăng ký</Link></p>
      </div>
    </div>
  );
}
