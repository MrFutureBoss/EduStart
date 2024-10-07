import { Fragment, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Layout, Menu, Dropdown, Typography, Button, Row, Col, Popover } from "antd";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";

const { Header } = Layout;
const { Text } = Typography;

function DefaultNavbar({ brand, routes, transparent, light, action, sticky, relative, center }) {
  const [mobileNavbar, setMobileNavbar] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const jwt = localStorage.getItem("jwt");

  const openMobileNavbar = () => setMobileNavbar(!mobileNavbar);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 992) {
        setMobileView(true);
        setMobileNavbar(false);
      } else {
        setMobileView(false);
        setMobileNavbar(false);
      }
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderNavbarItems = routes()?.map(({ name, icon, href, route, collapse }) => {
    return (
      <Menu.Item key={name}>
        {collapse ? (
          <Dropdown overlay={renderDropdownMenu(collapse)} trigger={["hover"]}>
            <Text>{name}</Text>
          </Dropdown>
        ) : (
          <Link to={route || href}>{name}</Link>
        )}
      </Menu.Item>
    );
  });

  const renderDropdownMenu = (collapse) => (
    <Menu>
      {collapse.map((item) => (
        <Menu.Item key={item.name}>
          <Link to={item.route || item.href}>{item.name}</Link>
        </Menu.Item>
      ))}
    </Menu>
  );

  const mobileMenu = (
    <Menu mode="vertical">
      {renderNavbarItems}
      {!jwt ? (
        <Menu.Item key="login">
          <Link to="/presentation/auth/sign-in">Đăng nhập</Link>
        </Menu.Item>
      ) : (
        <Menu.Item
          key="logout"
          onClick={() => {
            localStorage.removeItem("jwt");
          }}
        >
          Đăng xuất
        </Menu.Item>
      )}
    </Menu>
  );

  return (
    <Header className={`navbar ${sticky ? "sticky" : ""} ${transparent ? "transparent" : ""}`}>
      <Row justify="space-between" align="middle">
        <Col>
          <Link to="/" className="navbar-brand">
            {brand}
          </Link>
        </Col>
        <Col className="navbar-menu">
          {!mobileView ? (
            <Menu mode="horizontal">{renderNavbarItems}</Menu>
          ) : (
            <Popover
              content={mobileMenu}
              trigger="click"
              visible={mobileNavbar}
              onVisibleChange={openMobileNavbar}
            >
              <Button icon={mobileNavbar ? <CloseOutlined /> : <MenuOutlined />} />
            </Popover>
          )}
        </Col>
        <Col>
          {action && (
            <Button type={action.color || "primary"}>
              {action.type === "internal" ? (
                <Link to={action.route}>{action.label}</Link>
              ) : (
                <a href={action.route} target="_blank" rel="noopener noreferrer">
                  {action.label}
                </a>
              )}
            </Button>
          )}
        </Col>
      </Row>
    </Header>
  );
}

DefaultNavbar.defaultProps = {
  brand: "StartUp Gate",
  transparent: false,
  light: false,
  action: false,
  sticky: false,
  relative: false,
  center: false,
};

DefaultNavbar.propTypes = {
  brand: PropTypes.string,
  routes: PropTypes.func.isRequired,
  transparent: PropTypes.bool,
  light: PropTypes.bool,
  action: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({
      type: PropTypes.oneOf(["external", "internal"]).isRequired,
      route: PropTypes.string.isRequired,
      color: PropTypes.string,
      label: PropTypes.string.isRequired,
    }),
  ]),
  sticky: PropTypes.bool,
  relative: PropTypes.bool,
  center: PropTypes.bool,
};

export default DefaultNavbar;
