import Matched from "../../models/matchedModel.js";
import matchedDAO from "../../repositories/matchedDAO/index.js";
describe("Matched DAO createNewTimeEvent Validation", () => {
  const matchedId = "67493d1ff0cf740bf4029076";
  const groupId = "674938f1f0cf740bf4028b4e";
  const mentorId = "674930f940b65c51e85ff0d4";
  beforeEach(() => {
    jest.clearAllMocks(); // Clear tất cả mock trước mỗi test
    console.clear(); // Xóa console log trước mỗi test (tùy chọn)
  });
  it("Tạo thành công lịch họp", async () => {
    const validData = {
      groupId: "63f4b2f8e0e5f24b98e4b0c9",
      mentorId: "63f4b2f8e0e5f24b98e4b0d0",
      status: "Pending",
      time: [
        {
          title: "Sự kiện hợp lệ",
          allDay: false,
          start: new Date("2024-12-04"),
          end: new Date("2024-12-09"),
        },
      ],
    };

    const matched = new Matched(validData);
    const expectedMessage = "Validation passed successfully";
    let receivedMessage = "";

    try {
      await matched.validate();
      receivedMessage = "Validation passed successfully";
      console.log("EXPECTED:", expectedMessage);
      console.log("RECEIVED:", receivedMessage);
      expect(receivedMessage).toBe(expectedMessage);
    } catch (error) {
      console.error("Validation failed unexpectedly:", error.message);
      throw error;
    }
  });

  // it("Tiêu đề lịch họp không rỗng", async () => {
  //   const invalidData = {
  //     time: [
  //       {
  //         title: "",
  //         start: new Date("2024-12-04"),
  //         end: new Date("2024-12-09"),
  //       },
  //     ],
  //   };
  //   let validationError = null;

  //   try {
  //     await matchedDAO.createNewTimeEvents(matchedId, invalidData.time);
  //   } catch (error) {
  //     validationError = error;
  //   }

  //   const expectedMessage = "Path `title` is required.";
  //   const receivedMessage = Object.values(validationError.errors)[0]?.message;

  //   console.log("EXPECTED:", expectedMessage);
  //   console.log("RECEIVED:", receivedMessage);

  //   expect(receivedMessage).toBe(expectedMessage);
  // });

  it("Tiêu đề lịch họp không ít hơn 2 từ và lớn hơn 100", async () => {
    const invalidData = {
      groupId: "63f4b2f8e0e5f24b98e4b0c9",
      mentorId: "63f4b2f8e0e5f24b98e4b0d0",
      status: "Pending",
      time: [
        {
          title: "1",
          start: new Date("2024-12-04"),
          end: new Date("2024-12-09"),
        },
      ],
    };

    const matched = new Matched(invalidData);
    let validationError = null;

    try {
      await matched.validate();
    } catch (error) {
      validationError = error;
    }

    const invalidTitle = invalidData.time[0].title;
    const expectedMessage = `Path \`title\` (\`${invalidTitle}\`) is shorter than the minimum allowed length (2).`;
    const receivedMessage = Object.values(validationError.errors)[0]?.message;

    console.log("EXPECTED:", expectedMessage);
    console.log("RECEIVED:", receivedMessage);

    expect(receivedMessage).toBe(expectedMessage);
  });

  it("Thời gian không trống", async () => {
    const invalidData = {
      groupId: "63f4b2f8e0e5f24b98e4b0c9",
      mentorId: "63f4b2f8e0e5f24b98e4b0d0",
      status: "Pending",
      time: [
        {
          title: "Sự kiện 1",
          end: new Date("2024-12-04"),
        },
      ],
    };

    const matched = new Matched(invalidData);
    let validationError = null;

    try {
      await matched.validate();
    } catch (error) {
      validationError = error;
    }

    const expectedMessage = "Path `start` is required.";
    const receivedMessage = Object.values(validationError.errors)[0]?.message;

    console.log("EXPECTED:", expectedMessage);
    console.log("RECEIVED:", receivedMessage);

    expect(receivedMessage).toBe(expectedMessage);
  });

  it("Thời gian bắt đầu không lớn hơn thời gian kết thúc", async () => {
    const invalidData = {
      groupId: "63f4b2f8e0e5f24b98e4b0c9",
      mentorId: "63f4b2f8e0e5f24b98e4b0d0",
      status: "Pending",
      time: [
        {
          title: "Sự kiện 1",
          start: new Date("2024-12-05"),
          end: new Date("2024-12-04"),
        },
      ],
    };

    const matched = new Matched(invalidData);
    let validationError = null;

    try {
      await matched.validate();
    } catch (error) {
      validationError = error;
    }

    const expectedMessage = "End time must be greater than start time.";
    const receivedMessage = Object.values(validationError.errors)[0]?.message;

    console.log("EXPECTED:", expectedMessage);
    console.log("RECEIVED:", receivedMessage);

    expect(receivedMessage).toBe(expectedMessage);
  });

  it("Tiêu đề rỗng và thời gian bắt đầu không lớn hơn thời gian kết thúc", async () => {
    const invalidData = {
      groupId: "63f4b2f8e0e5f24b98e4b0c9",
      mentorId: "63f4b2f8e0e5f24b98e4b0d0",
      status: "Pending",
      time: [
        {
          title: "",
          start: new Date("2024-12-05"),
          end: new Date("2024-12-04"),
        },
      ],
    };

    const matched = new Matched(invalidData);
    let validationError = null;

    try {
      await matched.validate();
    } catch (error) {
      validationError = error;
    }

    const expectedMessage = "Path `title` is required.";
    const receivedMessage = Object.values(validationError.errors)[0]?.message;

    console.log("EXPECTED:", expectedMessage);
    console.log("RECEIVED:", receivedMessage);

    expect(receivedMessage).toBe(expectedMessage);
  });

  it("Format date sai ở thời gian bắt đầu hoặc kết thúc", async () => {
    const invalidData = {
      groupId: "63f4b2f8e0e5f24b98e4b0c9",
      mentorId: "63f4b2f8e0e5f24b98e4b0d0",
      status: "Pending",
      time: [
        {
          title: "",
          start: new Date("2024-13-05"),
          end: new Date("2024-12-04"),
        },
      ],
    };

    const matched = new Matched(invalidData);
    let validationError = null;

    try {
      await matched.validate();
    } catch (error) {
      validationError = error;
    }

    const expectedMessage =
      'Cast to date failed for value "Invalid Date" (type Date) at path "start"';
    const receivedMessage = Object.values(validationError.errors)[0]?.message;

    console.log("EXPECTED:", expectedMessage);
    console.log("RECEIVED:", receivedMessage);

    expect(receivedMessage).toBe(expectedMessage);
  });
});
