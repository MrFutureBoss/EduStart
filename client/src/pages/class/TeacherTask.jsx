import { Col, Row } from "antd";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassTaskData } from "../../redux/slice/ClassManagementSlice";
import { useMemo, useEffect } from "react";
import { GrGroup } from "react-icons/gr";
import { FaRegCalendar } from "react-icons/fa";
import { CiWarning } from "react-icons/ci";

const TeacherTask = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");

  const config = useMemo(
    () => ({
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      },
    }),
    [jwt]
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/task/${userId}`,
          config
        );
        dispatch(setClassTaskData(response.data));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [userId, config, dispatch]);

  const classTask = useSelector((state) => state.classManagement.classtask) || {
    data: [],
  };

  console.log("TeacherTask: " + JSON.stringify(classTask));

  const classesWithEmptyGroup = Array.isArray(classTask.data)
    ? classTask.data.filter((item) => item.tempGroupId.length === 0)
    : [];

  const classesWithIncompleteGroups = Array.isArray(classTask.data)
    ? classTask.data.filter((item) =>
        item.tempGroupId.some((group) => group.status === false)
      )
    : [];

  // Số lượng lớp chưa được tạo nhóm
  const countClassesWithEmptyGroup = classesWithEmptyGroup.length;

  // Số lượng lớp chưa chốt nhóm xong
  const countClassesWithIncompleteGroups = classesWithIncompleteGroups.length;

  return (
    <Row>
      <Col span={24}>
        <Row>
          <span style={{ fontSize: "1.1rem", fontWeight: "500" }}>
            Tổng vấn đề bạn cần giải quyết là:&nbsp;
          </span>
          <span style={{ fontSize: "1.1rem", fontWeight: "500" }}>
            {countClassesWithEmptyGroup + countClassesWithIncompleteGroups}
          </span>
        </Row>
        <Row style={{ margin: "0.3rem auto 1rem auto" }}>
          <span style={{ fontSize: "1rem", fontWeight: "500" }}>
            Loại vấn đề:&nbsp;
          </span>
          <span style={{ fontSize: "1rem", fontWeight: "500", color:'red' }}>
            {countClassesWithEmptyGroup} ưu tiên
          </span>
          <span style={{ fontSize: "1rem"}}>, &nbsp;</span>
          <span style={{ fontSize: "1rem", fontWeight: "500", color:'#FFBA57' }}>
            {countClassesWithIncompleteGroups} nhắc nhở
          </span>
        </Row>
        <Row gutter={[32, 16]}>
          {/* Task cần làm */}
          {countClassesWithEmptyGroup > 0 && (
            <Col xs={24} sm={12} md={12} lg={12} xl={12}>
              <Row
                className="class-management-card priorityhigh"
                gutter={[16, 16]}
              >
                <Col xs={24} style={{ padding: "0px" }}>
                  {/* Upper Content */}
                  <Row className="content">
                    <Col xs={24} md={16} sm={16}>
                      <Row className="data-value">
                        <p>{countClassesWithEmptyGroup} </p>
                      </Row>
                      <Row className="title">
                        <p>Lớp chưa được tạo nhóm</p>
                      </Row>
                    </Col>
                    <Col xs={24} md={8} sm={8} className="icon-position">
                      <CiWarning
                        style={{ color: "#FF5252", fontWeight: "600" }}
                      />
                    </Col>
                  </Row>
                  {/* Footer Content */}
                  <Row className="footer red-card">
                    <p>Bấm vào để xem chi tiết</p>
                  </Row>
                </Col>
              </Row>
            </Col>
          )}
          {/* Số nhóm chưa có đủ thành viên */}
          {countClassesWithIncompleteGroups > 0 && (
            <Col xs={24} sm={12} md={12} lg={12} xl={12}>
              <Row className="class-management-card" gutter={[16, 16]}>
                <Col xs={24} style={{ padding: "0px" }}>
                  {/* Upper Content */}
                  <Row className="content">
                    <Col xs={24} md={16} sm={16}>
                      <Row className="data-value">
                        <p style={{ color: "#FFBA57" }}>
                          {countClassesWithIncompleteGroups}
                        </p>
                      </Row>
                      <Row className="title">
                        <p>Lớp chưa chốt nhóm xong</p>
                      </Row>
                    </Col>
                    <Col xs={24} md={8} sm={8} className="icon-position">
                      <GrGroup />
                    </Col>
                  </Row>
                  {/* Footer Content */}
                  <Row className="footer yellow-card">
                    <p>Bấm vào để xem chi tiết</p>
                  </Row>
                </Col>
              </Row>
            </Col>
          )}
        </Row>
      </Col>
    </Row>
  );
};

export default TeacherTask;
