import Matched from "../../models/matchedModel.js";
import MentorCategory from "../../models/mentorCategoryModel.js";
import TemporaryMatching from "../../models/temporaryMatchingModel.js";
import matchedDAO from "../../repositories/matchedDAO/index.js";

jest.mock("../../models/matchedModel.js");
jest.mock("../../models/mentorCategoryModel.js");
jest.mock("../../models/temporaryMatchingModel.js");

describe("createMatched", () => {
  afterEach(() => {
    jest.clearAllMocks(); 
  });

  test("nên tạo một bản ghi matched mới và cập nhật currentLoad của mentor", async () => {
    // Dữ liệu đầu vào mock
    const inputData = {
      groupId: "group123",
      mentorId: "mentor123",
      status: "Pending",
    };

    // Mock dữ liệu trả về của Matched và MentorCategory
    const matchedMock = {
      save: jest.fn().mockResolvedValue({
        _id: "matched123",
        groupId: inputData.groupId,
        mentorId: inputData.mentorId,
        status: "Pending",
      }),
    };
    Matched.mockImplementation(() => matchedMock);

    const mentorCategoryMock = {
      mentorId: inputData.mentorId,
      currentLoad: 4,
      maxLoad: 5,
    };
    MentorCategory.findOneAndUpdate.mockResolvedValue(mentorCategoryMock);

    // Mock updateMany của TemporaryMatching
    TemporaryMatching.updateMany.mockResolvedValue({});

    // Gọi hàm cần test
    const result = await matchedDAO.createMatched(inputData);

    // Kiểm tra kết quả trả về
    expect(result).toEqual({
      _id: "matched123",
      groupId: inputData.groupId,
      mentorId: inputData.mentorId,
      status: "Pending",
    });

    // Kiểm tra các phương thức được gọi với đúng tham số
    expect(Matched).toHaveBeenCalledWith({
      groupId: inputData.groupId,
      mentorId: inputData.mentorId,
      status: "Pending",
    });
    expect(matchedMock.save).toHaveBeenCalled();

    expect(MentorCategory.findOneAndUpdate).toHaveBeenCalledWith(
      { mentorId: inputData.mentorId },
      { $inc: { currentLoad: 1 } },
      { new: true }
    );

    expect(TemporaryMatching.updateMany).not.toHaveBeenCalled(); // Vì currentLoad chưa đạt maxLoad
  });

  test("nên xóa mentor khỏi TemporaryMatching nếu maxLoad đã đạt", async () => {
    // Dữ liệu đầu vào mock
    const inputData = {
      groupId: "group123",
      mentorId: "mentor123",
      status: "Pending",
    };

    // Mock dữ liệu trả về của Matched và MentorCategory
    const matchedMock = {
      save: jest.fn().mockResolvedValue({
        _id: "matched123",
        groupId: inputData.groupId,
        mentorId: inputData.mentorId,
        status: "Pending",
      }),
    };
    Matched.mockImplementation(() => matchedMock);

    const mentorCategoryMock = {
      mentorId: inputData.mentorId,
      currentLoad: 5, // Đã đạt maxLoad
      maxLoad: 5,
    };
    MentorCategory.findOneAndUpdate.mockResolvedValue(mentorCategoryMock);

    // Mock updateMany của TemporaryMatching
    TemporaryMatching.updateMany.mockResolvedValue({});

    // Gọi hàm cần test
    const result = await matchedDAO.createMatched(inputData);

    // Kiểm tra kết quả trả về
    expect(result).toEqual({
      _id: "matched123",
      groupId: inputData.groupId,
      mentorId: inputData.mentorId,
      status: "Pending",
    });

    // Kiểm tra các phương thức được gọi với đúng tham số
    expect(Matched).toHaveBeenCalledWith({
      groupId: inputData.groupId,
      mentorId: inputData.mentorId,
      status: "Pending",
    });
    expect(matchedMock.save).toHaveBeenCalled();

    expect(MentorCategory.findOneAndUpdate).toHaveBeenCalledWith(
      { mentorId: inputData.mentorId },
      { $inc: { currentLoad: 1 } },
      { new: true }
    );

    expect(TemporaryMatching.updateMany).toHaveBeenCalledWith(
      {
        $or: [
          { "mentorPreferred.mentorId": inputData.mentorId },
          { "teacherPreferredMentors.mentorId": inputData.mentorId },
          { "matchingMentors.mentorId": inputData.mentorId },
        ],
      },
      {
        $pull: {
          mentorPreferred: { mentorId: inputData.mentorId },
          teacherPreferredMentors: { mentorId: inputData.mentorId },
          matchingMentors: { mentorId: inputData.mentorId },
        },
      }
    );
  });

  test("nên ném ra lỗi nếu việc tạo mới thất bại", async () => {
    // Dữ liệu đầu vào mock
    const inputData = {
      groupId: "group123",
      mentorId: "mentor123",
      status: "Pending",
    };

    // Mock Matched để tạo lỗi
    Matched.mockImplementation(() => {
      throw new Error("Không thể tạo mới Matched");
    });

    // Gọi hàm và kiểm tra lỗi
    await expect(matchedDAO.createMatched(inputData)).rejects.toThrow(
      "Không thể tạo mới Matched"
    );
  });
});
