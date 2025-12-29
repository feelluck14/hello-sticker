import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)", // 모든 경로에 적용
        headers: [
          {
            key: "Cache-Control",
            value: "no-store", // 캐시 사용하지 않음
          },
        ],
      },
    ];
  },
};

export default nextConfig;