import axios from "axios";
import { BASE_URL } from "./utilities/initalValue";

// Hàm để lấy JWT từ localStorage mỗi khi gọi API
const getJWT = () => {
  return localStorage.getItem("jwt");
};

// Hàm tạo config cho mỗi gọi API
const getConfig = () => {
  const jwt = getJWT();
  return {
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${jwt}`,
    },
  };
};

// API để lấy danh sách profession và specialty
export const fetchTreeData = (teacherId) => {
  return axios.get(
    `${BASE_URL}/mentorcategory/data_tree/${teacherId}`,
    getConfig()
  );
};

// API để lấy danh sách mentor dựa trên profession và specialty
export const fetchMentors = (professionId, specialtyId) => {
  const config = {
    ...getConfig(),
    params: {
      professionId,
      specialtyId,
    },
  };
  return axios.get(`${BASE_URL}/mentorcategory/mentors_list`, config);
};

// API để lưu lựa chọn mentor với thứ tự ưu tiên
export const saveMentorSelection = (data) => {
  return axios.post(`${BASE_URL}/mentorcategory/selection`, data, getConfig());
};

// API để lấy danh sách mentor đã lưu của giáo viên
export const fetchTeacherSelection = (teacherId, professionId, specialtyId) => {
  const config = {
    ...getConfig(),
    params: {
      teacherId,
      professionId,
      specialtyId,
    },
  };
  return axios.get(`${BASE_URL}/mentorcategory/selection`, config);
};
