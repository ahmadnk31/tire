import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();
const nextConfig: NextConfig = {
  /* config options here */
  images:{
    remotePatterns:[
      {
        protocol: "https",
        hostname: "tire-files.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/products/**"
      },
      {
        protocol: "https",
        hostname: "tire-files.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/brands/**"
      },
      {
        protocol: "https",
        hostname: "tire-files.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/categories/**"
      },
      {
        protocol: "https",
        hostname: "tire-files.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/general/**"
      },
      {
        protocol: "https",
        hostname: "tire-files.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/vehicle-makes/**"
      },
      {
        protocol: "https",
        hostname: "tire-files.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/vehicle-models/**"
      },
      {
        protocol: "https",
        hostname: "tire-files.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/vehicle-trims/**"
      },
      {
        protocol: "https",
        hostname: "tire-files.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/new-path/**"
      },
      {
        protocol: "https",
        hostname: "tire-files.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/new-path/**"
      },
      {
        protocol: "https",
        hostname: "tire-files.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/new-path/**"
      },
      {
        protocol: "https",
        hostname: "tire-files.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/avatars/**"
      }
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);