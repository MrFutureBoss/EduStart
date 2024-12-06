/** @type {import('jest').Config} */
const config = {
  // Thu thập thông tin về coverage (độ bao phủ mã nguồn)
  collectCoverage: true,

  // Thư mục để xuất file coverage
  coverageDirectory: "coverage",

  // Danh sách các file cần thu thập coverage
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}", // Thu thập coverage từ tất cả các file trong src/
    "!src/**/*.d.ts",           // Loại trừ file định nghĩa TypeScript
  ],

  // Các thư mục cần bỏ qua khi thu thập coverage
  coveragePathIgnorePatterns: [
    "/node_modules/",  // Bỏ qua thư mục node_modules
    "/dist/",          // Bỏ qua thư mục build/dist
  ],

  // Kích hoạt chế độ chi tiết cho kết quả test
  verbose: true,

  // Cấu hình môi trường kiểm thử
  testEnvironment: "node",

  // Các file được xem là file test
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",  // File trong thư mục __tests__
    "**/?(*.)+(spec|test).[tj]s?(x)", // File có đuôi .spec.js hoặc .test.js
  ],

  // Bỏ qua các file hoặc thư mục khi tìm kiếm file test
  testPathIgnorePatterns: [
    "/node_modules/", // Bỏ qua node_modules
    "/dist/",         // Bỏ qua thư mục build/dist
  ],

  // Hỗ trợ các extension thường dùng
  moduleFileExtensions: [
    "js",
    "mjs",
    "cjs",
    "jsx",
    "ts",
    "tsx",
    "json",
    "node",
  ],

  // Sử dụng transformer nếu cần cho TypeScript hoặc JSX (nếu không, bỏ qua)
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest", // Sử dụng babel-jest để transpile mã nguồn
  },

  // Bỏ qua transform cho node_modules
  transformIgnorePatterns: [
    "/node_modules/",
  ],

  // Kích hoạt báo cáo coverage chi tiết
  coverageReporters: [
    "json",    // Báo cáo coverage ở dạng JSON
    "text",    // Hiển thị coverage trên terminal
    "lcov",    // Báo cáo coverage dạng LCov (cho CI/CD)
    "clover",  // Báo cáo coverage dạng Clover
  ],
};

export default config;
