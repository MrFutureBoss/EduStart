import React from 'react';
import { Button, Card, Input, Avatar } from 'antd';
import { PhoneOutlined } from '@ant-design/icons';

const StudentProfile = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card
        style={{ width: 500, backgroundColor: '#f0f2f5', padding: 20, borderRadius: 10, boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}
        bodyStyle={{ padding: 0 }}
      >
        

        {/* Ảnh và số liên lạc */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Avatar
            size={120}
            src="https://static.vecteezy.com/system/resources/previews/021/770/056/non_2x/avatar-of-a-student-character-free-vector.jpg"
            alt="Ảnh đại diện"
            style={{ marginBottom: 10 }}
          />
          <br />
          <Button shape="round" icon={<PhoneOutlined />} href="tel:+849xxxxxxxx">
            📞 Số liên lạc
          </Button>
        </div>

        {/* Thông tin sinh viên */}
        <div style={{ marginBottom: 20 }}>
          <p><strong>Tên:</strong></p>
          <p><strong>Lớp:</strong></p>
          <p><strong>Email:</strong></p>
        </div>

        {/* Các nút hành động */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button type="default">Chỉnh sửa thông tin cá nhân</Button>
          <Button type="default">Đổi mật khẩu</Button>
        </div>
      </Card>
    </div>
  );
};

export default StudentProfile;
