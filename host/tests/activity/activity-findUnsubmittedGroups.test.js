import Activity from "../../models/activityModel.js";
import activityDAO from "../../repositories/activityDAO/index.js";

jest.mock("../../models/activityModel.js");

describe("findUnsubmittedGroups", () => {
  afterEach(() => {
    jest.clearAllMocks(); // Xoá mock giữa các test
  });

  test("should return unsubmitted groups for a given outcomeId and classId", async () => {
    const mockData = [
      {
        completed: false,
        activityType: "outcome",
        outcomeId: "6717cdc43cdaefd84e901ec2",
        classId: "670bb3642eb65e19740ca591",
        groupId: { _id: "670bb3642eb65e19740ca592", name: "Group A" },
        classId: { _id: "670bb3642eb65e19740ca591", className: "Class 1" },
      },
    ];

    const mockFind = {
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockData),
    };
    Activity.find.mockReturnValue(mockFind);

    const outcomeId = "6717cdc43cdaefd84e901ec2";
    const classId = "670bb3642eb65e19740ca591";
    const result = await activityDAO.findUnsubmittedGroups(outcomeId, classId);

    expect(Activity.find).toHaveBeenCalledWith({
      completed: false,
      activityType: "outcome",
      outcomeId,
      classId,
    });

    expect(mockFind.populate).toHaveBeenCalledWith("groupId", "name");
    expect(mockFind.populate).toHaveBeenCalledWith("classId", "className");

    expect(result).toEqual(mockData);
  });

  test("should return an empty array if no unsubmitted groups are found", async () => {
    const mockFind = {
      populate: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([]),
    };
    Activity.find.mockReturnValue(mockFind);

    const outcomeId = "6717cdc43cdaefd84e901ec26";
    const classId = "670bb3642eb65e19740ca591";
    const result = await activityDAO.findUnsubmittedGroups(outcomeId, classId);

    expect(Activity.find).toHaveBeenCalledWith({
      completed: false,
      activityType: "outcome",
      outcomeId,
      classId,
    });

    expect(result).toEqual([]);
  });

  test("should throw an error if Activity.find fails", async () => {
    Activity.find.mockImplementation(() => {
      throw new Error("Database error");
    });

    const outcomeId = "670bb3642eb65e19740ca591";
    const classId = "670bb3642eb65e19740ca591";

    await expect(activityDAO.findUnsubmittedGroups(outcomeId, classId)).rejects.toThrow("Database error");

    expect(Activity.find).toHaveBeenCalledWith({
      completed: false,
      activityType: "outcome",
      outcomeId,
      classId,
    });
  });

  // Test thêm
  test("should throw an error if outcomeId or classId is missing", async () => {
    await expect(activityDAO.findUnsubmittedGroups(null, "classId123")).rejects.toThrow(
      "OutcomeId and ClassId are required."
    );
    await expect(activityDAO.findUnsubmittedGroups("outcomeId123", null)).rejects.toThrow(
      "OutcomeId and ClassId are required."
    );
  });

  test("should throw an error if outcomeId or classId is invalid", async () => {
    await expect(activityDAO.findUnsubmittedGroups("invalidId", "classId123")).rejects.toThrow(
      "Invalid OutcomeId or ClassId format."
    );
    await expect(activityDAO.findUnsubmittedGroups("outcomeId123", "invalidId")).rejects.toThrow(
      "Invalid OutcomeId or ClassId format."
    );
  });
});
