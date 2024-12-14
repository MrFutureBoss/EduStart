import React, { useState, useEffect, useMemo } from "react";
import { Steps, Tooltip, Spin, message } from "antd";
import moment from "moment";
import axios from "axios";
import { BASE_URL } from "../../utilities/initalValue";
import { useDispatch, useSelector } from "react-redux";
import { setClassList } from "../../redux/slice/ClassSlice";
import {
  CaretDownOutlined,
  CaretUpOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import calculateStartdateAndEnddateOfOutcomes from "./calculateStartdateAndEnddateOfOutcomes";
import "../../style/Activity/monitorStep.css";

const { Step } = Steps;

const MonitorStep = () => {
  const [loading, setLoading] = useState(true);
  const [outcomes, setOutcomes] = useState([]);
  const [groupsNotSubmittedByOutcome, setGroupsNotSubmittedByOutcome] =
    useState({});
  const [isTooltipVisibleForAll, setIsTooltipVisibleForAll] = useState(false);
  const dispatch = useDispatch();
  const classList = useSelector((state) => state.class.classList);
  const navigate = useNavigate();

  const jwt = localStorage.getItem("jwt");
  const config = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${jwt}` },
    }),
    [jwt]
  );

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(
          `${BASE_URL}/class/${localStorage.getItem("userId")}/user`,
          config
        );
        dispatch(setClassList(response.data));
      } catch (error) {
        console.error("Error fetching class list:", error);
        message.error("Không thể tải danh sách lớp học.");
      }
    };
    if (classList?.length === 0) {
      fetchClasses();
    }
  }, [classList?.length, dispatch, config]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const semesterResponse = await axios.get(
          `${BASE_URL}/semester/current`,
          config
        );
        const fetchedSemester = semesterResponse.data;

        const outcomesResponse = await axios.get(
          `${BASE_URL}/activity/outcome-type/semester/${fetchedSemester._id}`,
          config
        );

        const sortedOutcomes = outcomesResponse.data.sort((a, b) => {
          const numberA = parseInt(a.name.replace(/[^0-9]/g, ""), 10);
          const numberB = parseInt(b.name.replace(/[^0-9]/g, ""), 10);
          return numberA - numberB;
        });

        const calculatedOutcomes = calculateStartdateAndEnddateOfOutcomes(
          fetchedSemester.startDate,
          fetchedSemester.endDate,
          sortedOutcomes.length
        );

        const updatedOutcomes = sortedOutcomes.map((outcome, index) => {
          const calculatedOutcome =
            calculatedOutcomes[`outcome${index + 1}`] || {};
          return {
            ...outcome,
            startDate: outcome.startDate
              ? moment(outcome.startDate)
              : moment(
                  calculatedOutcome.startDate || fetchedSemester.startDate
                ),
            endDate: outcome.endDate
              ? moment(outcome.endDate)
              : moment(calculatedOutcome.endDate || fetchedSemester.endDate),
          };
        });

        setOutcomes(updatedOutcomes);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Không thể tải dữ liệu outcomes.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [config]);

  const fetchGroupsNotSubmitted = async (outcomeId) => {
    if (groupsNotSubmittedByOutcome[outcomeId]) {
      return;
    }

    try {
      const groupedResults = await Promise.all(
        classList.map(async (cls) => {
          try {
            const response = await axios.get(
              `${BASE_URL}/activity/unsubmitted-groups?outcomeId=${outcomeId}&classId=${cls._id}`,
              config
            );

            if (response.data.message === "No unsubmitted groups found") {
              return {
                className: cls.className,
                groups: [],
              };
            }

            return {
              className: cls.className,
              groups: response.data[cls.className] || [],
            };
          } catch (err) {
            if (
              err.response &&
              err.response.status === 404 &&
              err.response.data.message === "No unsubmitted groups found"
            ) {
              return {
                className: cls.className,
                groups: [],
              };
            } else {
              throw err;
            }
          }
        })
      );

      const groupedByClass = groupedResults.reduce(
        (acc, { className, groups }) => {
          acc[className] = groups;
          return acc;
        },
        {}
      );

      setGroupsNotSubmittedByOutcome((prev) => ({
        ...prev,
        [outcomeId]: groupedByClass,
      }));
    } catch (error) {
      console.error(
        `Error fetching groups not submitted for outcome ${outcomeId}:`,
        error
      );
    }
  };

  const sortedOutcomes = useMemo(() => {
    return [...outcomes].sort((a, b) =>
      moment(a.startDate).diff(moment(b.startDate))
    );
  }, [outcomes]);

  const currentStep = useMemo(() => {
    const today = moment();
    for (let i = 0; i < sortedOutcomes.length; i++) {
      const outcome = sortedOutcomes[i];
      const startDate = moment(outcome.startDate);
      const endDate = moment(outcome.endDate);

      if (today.isBetween(startDate, endDate, "day", "[]")) {
        return i;
      }
    }
    return sortedOutcomes.length - 1;
  }, [sortedOutcomes]);

  useEffect(() => {
    if (sortedOutcomes[currentStep] && classList.length > 0) {
      const outcomeId = sortedOutcomes[currentStep]._id;
      fetchGroupsNotSubmitted(outcomeId);
    }
  }, [currentStep, sortedOutcomes, classList]);

  if (loading) {
    return <Spin size="large" tip="Loading outcomes..." />;
  }

  const toggleTooltipsForAll = () => {
    setIsTooltipVisibleForAll((prevState) => !prevState);
  };

  return (
    <div
      style={{
        display: "flex",
        margin: "auto",
        width: "98.5%",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        padding: "12px 8px 6px 8px",
        borderTopRightRadius: "10px",
        borderTopLeftRadius: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        borderLeft: "5px solid #60b2c7",
        borderRight: "5px solid #60b2c7",
      }}
    >
      <div style={{ marginRight: "10px" }}>
        {isTooltipVisibleForAll ? (
          <CaretUpOutlined
            className="toggle-icon"
            onClick={toggleTooltipsForAll}
            style={{ fontSize: "24px", cursor: "pointer" }}
          />
        ) : (
          <CaretDownOutlined
            className="toggle-icon"
            onClick={toggleTooltipsForAll}
            style={{ fontSize: "24px", cursor: "pointer" }}
          />
        )}
      </div>
      <Steps
        current={currentStep}
        direction="horizontal"
        progressDot={(dot, { status, index }) => (
          <span
            style={{
              width: 8,
              height: 8,
              backgroundColor:
                status === "process"
                  ? "#1890ff"
                  : status === "finish"
                  ? "#52c41a"
                  : "#d9d9d9",
              borderRadius: "50%",
              display: "inline-block",
            }}
          />
        )}
      >
        <Step key="create-group" title="Tạo nhóm" status="process" />
        <Step
          key="assign-mentor"
          title="Chọn mentor cho nhóm"
          status="process"
        />
        <Step key="approve-project" title="Duyệt dự án" status="process" />
        {sortedOutcomes.map((outcome, index) => {
          const today = moment();
          const isBeforeStart = today.isBefore(
            moment(outcome.startDate),
            "day"
          );
          const outcomeGroups = groupsNotSubmittedByOutcome[outcome._id] || {};
          const handleMouseEnter = () => {
            if (!isBeforeStart) {
              fetchGroupsNotSubmitted(outcome._id);
            }
          };

          const allGroupsSubmitted =
            Object.values(outcomeGroups).length === 0 ||
            Object.values(outcomeGroups).every((groups) => groups.length === 0);

          const tooltipContent = allGroupsSubmitted ? (
            <span>Tất cả các nhóm đã nộp {outcome.name}</span>
          ) : (
            <div>
              <p>
                <strong>Loại: {outcome.name}</strong>
              </p>
              <strong>Số nhóm chưa nộp:</strong>
              {Object.entries(outcomeGroups).map(([className, groups], idx) => (
                <div key={idx} style={{ marginBottom: "8px" }}>
                  <span
                    className="hover-highlight"
                    onClick={() =>
                      navigate(`/teacher/class/detail/${className}/outcomes`)
                    }
                  >
                    {className} ({groups.length})
                  </span>
                </div>
              ))}
            </div>
          );
          const outcomeHasUnsubmittedGroups = Object.values(outcomeGroups).some(
            (groups) => groups.length > 0
          );
          return (
            <Step
              key={outcome._id || index}
              title={
                <Tooltip
                  title={
                    isTooltipVisibleForAll || !isBeforeStart
                      ? tooltipContent
                      : undefined
                  }
                  open={isTooltipVisibleForAll || undefined}
                >
                  <div
                    className={`step-title-monitor ${
                      index === currentStep ? "current-step-monitor" : ""
                    }`}
                    onMouseEnter={handleMouseEnter}
                  >
                    {outcome.name}
                    {outcomeHasUnsubmittedGroups && (
                      <ExclamationCircleOutlined className="issue-icon" />
                    )}
                  </div>
                </Tooltip>
              }
              description={
                <Tooltip
                  title={`Kết thúc: ${moment(outcome.endDate).format(
                    "DD/MM/YYYY"
                  )}`}
                >
                  <span>{moment(outcome.endDate).format("DD/MM/YYYY")}</span>
                </Tooltip>
              }
              className={index === currentStep ? "highlight-step-monitor" : ""}
            />
          );
        })}
      </Steps>
    </div>
  );
};

export default MonitorStep;
