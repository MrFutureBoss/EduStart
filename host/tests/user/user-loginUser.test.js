import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from "../../models/userModel.js";
import userDAO from "../../repositories/userDAO/user.js";

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock("../../models/userModel.js");


describe('loginUser', () => {
    afterEach(() => {
      jest.clearAllMocks(); // Reset mock giữa các test
    });
  
    test('should return a valid token when email and password are correct', async () => {
      const mockUser = {
        _id: 'userId123',
        email: 'hieudt46@fe.edu.vn',
        password: 'hashedPassword123',
        role: 1,
      };
  
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true); 
      jwt.sign.mockReturnValue('fakeToken123');
  
      const token = await userDAO.loginUser({ email: 'hieudt46@fe.edu.vn', password: 'password123' });
  
      expect(User.findOne).toHaveBeenCalledWith({ email: 'hieudt46@fe.edu.vn' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(jwt.sign).toHaveBeenCalledWith(
        { _id: mockUser._id, role: mockUser.role },
        process.env.SECRETKEY,
        { expiresIn: '12h' }
      );
      expect(token).toBe('fakeToken123');
    });
  
    test('should throw an error if the password is incorrect', async () => {
      const mockUser = {
        _id: 'userId123',
        email: 'test@example.com',
        password: 'hashedPassword123',
      };
  
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
  
      await expect(
        userDAO.loginUser({ email: 'test@example.com', password: 'wrongPassword' })
      ).rejects.toThrow('Wrong password.');
  
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword123');
    });
  
    test('should throw an error if the user is not found', async () => {
      User.findOne.mockResolvedValue(null);
  
      await expect(
        userDAO.loginUser({ email: 'notfound@example.com', password: 'password123' })
      ).rejects.toThrow('User not found.');
  
      expect(User.findOne).toHaveBeenCalledWith({ email: 'notfound@example.com' });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  
    test('should throw an error if there is a database error', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));
  
      await expect(
        userDAO.loginUser({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow('Database error');
  
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });
  });
  