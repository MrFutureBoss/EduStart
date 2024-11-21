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
// API này để lấy data tree của dự án của các lớp mà giáo viên đó phụ trách
export const fetchClassSummaryData = (teacherId) => {
  return axios.get(
    `${BASE_URL}/class/${teacherId}/summary_classses`,
    getConfig()
  );
};
// api để lấy dự án trong lớp
export const fetchProjectData = (teacherId, classId) => {
  return axios.get(
    `${BASE_URL}/class/projects/${teacherId}/${classId}`,
    getConfig()
  );
};
// api lấy danh sách gợi ý các mentor cho dự án trong lớp
export const fetchMentorsTempMatching = (classId, teacherId) => {
  const config = {
    ...getConfig(),
  };

  const data = {
    classId,
    teacherId,
  };

  return axios.post(`${BASE_URL}/tempMatching/recommend`, data, config);
};
// api để gán mentor được chọn cho nhóm
export const assignMentorToProject = async (groupId, mentorId) => {
  const config = {
    ...getConfig(),
  };

  const data = {
    groupId,
    mentorId,
  };
  return axios.post(`${BASE_URL}/matched/add-matched`, data, config);
};
// api để lấy thông tin dự án của nhóm
export const getProjectGroupData = (groupId) => {
  return axios.get(`${BASE_URL}/group/project/${groupId}`, getConfig());
};
// api để lấy thông tin matches của nhóm
export const getMatchedProject = (groupId) => {
  return axios.get(`${BASE_URL}/matched/infor-matched/${groupId}`, getConfig());
};
// API để kiểm tra kỳ học hiện tại và kỳ học sắp tới
export const checkSemesterStatus = () => {
  return axios.get(`${BASE_URL}/semester/check-semester-status`, getConfig());
};

// API để kiểm tra giáo viên trong kỳ học
export const checkTeachersInSemester = () => {
  return axios.get(`${BASE_URL}/semester/check-teachers`, getConfig());
};

// API để kiểm tra mentor trong kỳ học
export const checkMentorsInSemester = () => {
  return axios.get(`${BASE_URL}/semester/check-mentors`, getConfig());
};

// API để kiểm tra học sinh trong kỳ học
export const checkStudentsInSemester = () => {
  return axios.get(`${BASE_URL}/semester/check-students`, getConfig());
};

// API để kiểm tra học sinh có trạng thái Pending trong kỳ học
export const checkStudentsPendingStatus = () => {
  return axios.get(`${BASE_URL}/semester/check-students-pending`, getConfig());
};

// API để kiểm lớp học đã đủ học sinh chưa
export const checkClassStatus = () => {
  return axios.get(`${BASE_URL}/semester/check-class-capacity`, getConfig());
};

// API để kiểm giáo viên đã có lớp chưa
export const checkTeacherWithoutClassStatus = () => {
  return axios.get(
    `${BASE_URL}/semester/check-teachers-without-class`,
    getConfig()
  );
};

// API để lấy toàn bộ danh sách yêu cầu đổi lớp cho admin
export const getAllRequetChangClassAdmin = () => {
  return axios.get(
    `${BASE_URL}/classTranfer/all-transfer-requests`,
    getConfig()
  );
};

// API để lấy toàn bộ danh sách yêu cầu đổi lớp cho admin
export const updateTransferRequestStatus = (
  requestId,
  status,
  rejectMessage
) => {
  const config = {
    ...getConfig(),
  };

  const data = {
    requestId,
    status,
    rejectMessage,
  };
  return axios.patch(
    `${BASE_URL}/classTranfer/update-transfer-status`,
    data,
    config
  );
};

// API để lấy toàn bộ thông tin của mentor
export const getMentorProfile = (mentorId) => {
  return axios.get(`${BASE_URL}/mentor/mentor-infor/${mentorId}`, getConfig());
};

// API để lấy toàn bộ danh sách profession và speciatly
export const getAllProfesionAndSpeciatly = () => {
  return axios.get(`${BASE_URL}/profession/get-all`, getConfig());
};
