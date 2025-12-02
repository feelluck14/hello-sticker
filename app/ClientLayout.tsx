// app/ClientLayout.tsx (클라이언트 컴포넌트)
'use client'

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      await supabase.auth.getSession();
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="p-0 m-0">
        <div></div>
      </div>
    );
  }

  return <>{children}</>;
}