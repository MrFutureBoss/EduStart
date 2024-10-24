// src/api.js
import axios from "axios";
import { BASE_URL } from "./utilities/initalValue";
const jwt = localStorage.getItem("jwt");

const config = {
  headers: {
    "Content-Type": "application/json",
    authorization: `Bearer ${jwt}`,
  },
};
// API để lấy danh sách profession và specialty
export const fetchTreeData = () => {
  return axios.get(`${BASE_URL}/mentorcategory/data_tree`, config);
};

// API để lấy danh sách mentor dựa trên profession và specialty
export const fetchMentors = (professionId, specialtyId) => {
  const updatedConfig = {
    ...config,
    params: {
      professionId,
      specialtyId,
    },
  };
  return axios.get(`${BASE_URL}/mentorcategory/mentors_list`, updatedConfig);
};

// API để lưu lựa chọn mentor với thứ tự ưu tiên
export const saveMentorSelection = (data) => {
  return axios.post(`${BASE_URL}/mentorcategory/selection`, data, config);
};
// API để lấy danh sách mentor đã lưu của giáo viên
export const fetchTeacherSelection = (teacherId, professionId, specialtyId) => {
  const updatedConfig = {
    ...config,
    params: {
      teacherId,
      professionId,
      specialtyId,
    },
  };
  return axios.get(`${BASE_URL}/mentorcategory/selection`, updatedConfig);
};
