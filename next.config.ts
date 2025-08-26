
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverActions: {
    bodySizeLimit: '10mb',
  },
           images: {
           remotePatterns: [
             {
               protocol: 'https',
               hostname: 'placehold.co',
               port: '',
               pathname: '/**',
             },
             {
               protocol: 'https',
               hostname: 'lh3.googleusercontent.com',
               port: '',
               pathname: '/**',
             },
             {
               protocol: 'https',
               hostname: 'storage.googleapis.com',
               port: '',
               pathname: '/**',
             },
             {
               protocol: 'https',
               hostname: 'firebasestorage.googleapis.com',
               port: '',
               pathname: '/**',
             },
             {
               protocol: 'https',
               hostname: 'eduverse-98jdv.appspot.com',
               port: '',
               pathname: '/**',
             },
             {
               protocol: 'https',
               hostname: 'res.cloudinary.com',
               port: '',
               pathname: '/**',
             },
             {
               protocol: 'https',
               hostname: 'images.unsplash.com',
               port: '',
               pathname: '/**',
             }
           ],
         },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Node.js modules from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        'firebase-admin': false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        punycode: false,
      };
    }
    
    // Ignore specific modules that cause issues
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'firebase-admin': 'commonjs firebase-admin',
        'agent-base': 'commonjs agent-base',
        'https-proxy-agent': 'commonjs https-proxy-agent',
      });
    }
    
    return config;
  },
};

export default nextConfig;
