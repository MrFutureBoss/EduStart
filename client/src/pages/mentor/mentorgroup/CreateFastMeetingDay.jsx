import React, { useEffect, useMemo, useState } from "react";
import SmallModal from "../../../components/Modal/SmallModal";
import { Button, Col, Popconfirm, Row, Select } from "antd";
import ConfirmButton from "../../../components/Button/ConfirmButton";
import CancelButton from "../../../components/Button/CancelButton";
import { Option } from "antd/es/mentions";
import { setLoading } from "../../../redux/slice/ClassManagementSlice";
import { BASE_URL } from "../../../utilities/initalValue";
import { setMatchedGroups } from "../../../redux/slice/MatchedGroupSlice";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

const CreateFastMeetingDay = ({ open, close, content }) => {
    const jwt = localStorage.getItem("jwt");
    const userId = localStorage.getItem("userId");
    const dispatch = useDispatch();
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    
    const groups = useSelector((state) => state.matchedGroup.data || []);

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
        setLoading(true);
        try {
          const groupResponse = await axios.get(
            `${BASE_URL}/matched/mentor/${userId}`,
            config
          );
          dispatch(setMatchedGroups(groupResponse.data?.groups));
        } catch (error) {
          console.error(
            error.response ? error.response.data.message : error.message
          );
        } finally {
          setLoading(false);
        }
      };
  
      fetchUserData();
    }, [config, dispatch, userId]);

    const handleSelectChange = (value) => {
        setSelectedGroupId(value);
      };
  
    const modalContent = (
        <div
      >
        <div style={{ marginBottom: "1rem" }}>
          <strong>Chọn nhóm: </strong>
          <Select
            value={selectedGroupId}
            style={{ width: "300px" }}
            onChange={handleSelectChange}
            placeholder="Vui lòng chọn nhóm"
          >
            {groups.map((group) => (
              <Option key={group.matchedDetails._id} value={group.matchedDetails._id}>
                {`${group.class.className} - ${group.group.name}`}
              </Option>
            ))}
          </Select>
        </div>
        <div>{content}</div>
      </div>
  );
  const modalFooter = (
    <Row>
      <Col
        span={24}
        style={{ display: "flex", gap: "10px", justifyContent: "end" }}
      >
        <Popconfirm
          title="Bạn có chắc chắn muốn thêm lịch họp này không?"
          //   onConfirm={handleMakeNewEvent}
          okText="Đồng ý"
          cancelText="Hủy"
        >
          <ConfirmButton content="Thêm vào" />
        </Popconfirm>
        <CancelButton content="Hủy" onClick={close} />
      </Col>
    </Row>
  );
  return (
    <SmallModal
      title="Thêm lịch họp mới"
      content={modalContent}
      footer={modalFooter}
      closeable={true}
      isModalOpen={open}
      handleCancel={close}
    />
  );
};

export default CreateFastMeetingDay;
