
import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Static export configuration
  output: 'export',
  trailingSlash: true,
  poweredByHeader: false,
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
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
  
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Handle build-time errors gracefully
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Skip problematic pages during static export
  async generateStaticParams() {
    return [];
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
    
    // Replace Firebase modules with mocks during build
    config.resolve.alias = {
      ...config.resolve.alias,
      'firebase-admin': path.resolve(__dirname, 'firebase-mock.js'),
      'firebase/app': path.resolve(__dirname, 'firebase-mock.js'),
      'firebase/auth': path.resolve(__dirname, 'firebase-mock.js'),
      'firebase/firestore': path.resolve(__dirname, 'firebase-mock.js'),
      'firebase/storage': path.resolve(__dirname, 'firebase-mock.js'),
    };
    
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
