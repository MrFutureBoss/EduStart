import Swal from "sweetalert2";

const baseConfig = {
  confirmButtonText: "Xác nhận",
  cancelButtonText: "Huỷ",
  showCancelButton: true,
  icon: "info",
  reverseButtons: true,
};

export const showAutoCloseAlert = (
  title,
  text,
  icon = "success",
  timer = 1000
) => {
  Swal.fire({
    title: title,
    text: text,
    icon: icon,
    showConfirmButton: false,
    timer: timer,
    timerProgressBar: true,
  });
};

// Hàm hiển thị alert cơ bản
export const showAlert = (title, text, icon = "info") => {
  return Swal.fire({
    ...baseConfig,
    title: title,
    text: text,
    icon: icon, // icon: 'success', 'error', 'warning', 'info', 'question'
  });
};

// Hàm hiển thị alert thành công
export const showSuccessAlert = (title, text) => {
  return Swal.fire({
    ...baseConfig,
    title: title,
    text: text,
    icon: "success",
  });
};

// Hàm hiển thị alert lỗi
export const showErrorAlert = (title, text) => {
  return Swal.fire({
    ...baseConfig,
    title: title,
    text: text,
    icon: "error",
  });
};

// Hàm hiển thị alert cảnh báo
export const showWarningAlert = (title, text) => {
  return Swal.fire({
    ...baseConfig,
    title: title,
    text: text,
    icon: "warning",
  });
};

// Hàm hiển thị alert với custom config
export const showCustomAlert = (customConfig) => {
  return Swal.fire({
    ...baseConfig,
    ...customConfig,
  });
};
