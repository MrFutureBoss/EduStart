import React from "react";
import { Typography, Card, List, Collapse, Space } from "antd";
import { MailOutlined, PhoneOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import "../style/Support.css"; // Custom CSS for styling

const { Title, Text } = Typography;
const { Panel } = Collapse;

const Support = () => {
  const admin = {
    email: "admin@fpt.edu.vn",
    phoneNumber: "0123-456-789"
  };

  return (
    <div className="support-page">
      <Title level={2} className="support-title">💬 Support Center</Title>

      <Card className="support-card">
        <Title level={4}>Contact Us</Title>
        <Text>Please reach out to us through the following contact points:</Text>

        <List className="support-contact-list">
          <List.Item className="support-contact-item">
            <Space>
              <MailOutlined className="support-icon" />
              <Text strong>Email:</Text>
              <a href={`mailto:${admin.email}`} className="contact-link">
                {admin.email}
              </a>
            </Space>
            <br />
            <Space>
              <PhoneOutlined className="support-icon" />
              <Text strong>Phone:</Text>
              <a href={`tel:${admin.phoneNumber}`} className="contact-link">
                {admin.phoneNumber}
              </a>
            </Space>
          </List.Item>
        </List>
      </Card>

      <Card className="faq-card">
        <Title level={4}>FAQ <QuestionCircleOutlined /></Title>
        <Text>Common questions and answers to help you get started:</Text>

        <Collapse accordion className="faq-collapse">
          <Panel header="How do I add a class?" key="1">
            <Text>You can add a class by navigating to the 'Classes' section and clicking on 'Add Class'.</Text>
          </Panel>
          <Panel header="Can I update my personal information?" key="2">
            <Text>Yes, you can update your information in the 'Settings' section of your profile.</Text>
          </Panel>
          <Panel header="What if I forget my password?" key="3">
            <Text>Click on 'Forgot Password' on the login page to reset your password.</Text>
          </Panel>
        </Collapse>
      </Card>
    </div>
  );
};
export default Support;