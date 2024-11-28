import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassTaskData } from "../../redux/slice/ClassManagementSlice";
import { useRef, useState, useEffect, useMemo } from "react";
import { Card, Empty, Tooltip } from "antd";
import { useNavigate } from "react-router-dom";

const CardClass = () => {
  const dispatch = useDispatch();
  const jwt = localStorage.getItem("jwt");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

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
        dispatch(setClassTaskData(response.data.data));
      } catch (error) {
        console.log(
          error.response ? error.response.data.message : error.message
        );
      }
    };

    fetchUserData();
  }, [userId, config, dispatch]);

  const classTask = useSelector((state) => state.classManagement.classtask);

  const handleMoveToClassDetail = (value) => {
    navigate(`/teacher/class/detail/${value}`);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        overflowX: "auto",
        padding: "40px 0px",
        gap: "3rem",
      }}
    >
      {classTask.length > 0 ? (
        classTask.map((cl) => (
          <Tooltip
            color="#008d87"
            title={`Bấm vào xem chi tiết lớp ${cl?.className}`}
          >
            <Card
              style={{ cursor: "pointer" }}
              title={
                <div className="card-groupname">
                  <div>{cl?.className}</div>
                </div>
              }
              onClick={() => handleMoveToClassDetail(cl?.className)}
              bodyStyle={{
                padding: "0",
              }}
              headStyle={{
                background:
                  "linear-gradient(-45deg, #005241, #128066, #00524f, #008d87)",
                color: "white",
              }}
              bordered
              className="card-groupstudents"
            >
              <Card.Grid style={{ width: "100%", lineHeight: "1.4rem" }}>
                <p style={{ width: "100%", padding: "0px", margin: "0px" }}>
                  <span style={{ fontWeight: "700" }}>Sĩ số lớp:</span>{" "}
                  <span>{cl?.totalStudentInClass}</span>
                </p>
                <p style={{ width: "100%", padding: "0px", margin: "0px" }}>
                  <span style={{ fontWeight: "700" }}>Số nhóm:</span>{" "}
                  <span>{cl?.tempGroupId.length}</span>
                </p>
                <p style={{ width: "100%", padding: "0px", margin: "0px" }}>
                  <span style={{ fontWeight: "700" }}>Trạng thái lớp: </span>
                  <span>Đang tạo nhóm</span>
                </p>
                <p>
                  <span style={{ fontWeight: "700" }}>Việc cần làm:</span>
                  <span> Tạo nhóm lớp</span>
                </p>
              </Card.Grid>
            </Card>
          </Tooltip>
        ))
      ) : (
        <Empty />
      )}
    </div>
  );
};

export default CardClass;
