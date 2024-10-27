import { useState } from "react";
import { Avatar, Input, Button, Layout, Menu, Card, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Sider, Content } = Layout;
const { Title } = Typography;

export default function Component() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [isEditing, setIsEditing] = useState(false);

  const user = {
    username: "Trần Lê Phương Linh",
    email: "linhtlphe170820@fpt.edu.vn",
    rollNumber: "HE170820",
    memberCode: "linhtlphe170820",
  };

  const menuItems = [
    {
      key: "Profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "Security",
      icon: <LockOutlined />,
      label: "Security",
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider width={250} theme="light">
        <div className="p-4 text-center">
          <Avatar size={100} icon={<UserOutlined />} />
          <Title level={4} className="mt-2">
            {user.username}
          </Title>
          <p className="text-sm text-gray-500">View public profile</p>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeTab]}
          onClick={({ key }) => {
            setActiveTab(key);
            setIsEditing(false); // Reset editing mode
          }}
          items={menuItems}
        />
      </Sider>

      {/* Content Area */}
      <Layout>
        <Content style={{ padding: "20px 40px" }}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <Title level={3}>
                {activeTab === "Profile" ? "Public profile" : "Security Settings"}
              </Title>

            </div>

          </div>

          {activeTab === "Profile" && (
            <Card title="Your Profile" bordered={false}
              style={{
                maxWidth: 500, // Restrict the width of the card
                width: "100%", // Ensure card doesn't exceed full width of screen
                margin: "0 auto", // Center horizontally
                padding: "20px", // Internal padding
              }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <Input
                    id="username"
                    defaultValue={user.username}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input id="email" defaultValue={user.email} disabled={!isEditing} />
                </div>
                <div>
                  <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Roll Number
                  </label>
                  <Input id="rollNumber" defaultValue={user.rollNumber} disabled={!isEditing} />
                </div>
                <div>
                  <label htmlFor="memberCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Member Code
                  </label>
                  <Input id="memberCode" defaultValue={user.memberCode} disabled={!isEditing} />
                </div>
                <div className="mt-6 text-right">
                  <Button type="primary" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? "Save Changes" : "Edit Profile"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "Security" && (
            <Card title="Change Password" bordered={false}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <Input.Password id="currentPassword" />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <Input.Password id="newPassword" />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <Input.Password id="confirmPassword" />
                </div>
                <Button type="primary" className="mt-4">
                  Change Password
                </Button>
              </div>
            </Card>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
