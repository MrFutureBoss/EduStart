import axios from 'axios';
import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, ListGroup, Button, Form, InputGroup, Spinner, Modal } from 'react-bootstrap';
import { UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined, CheckOutlined, EditOutlined } from '@ant-design/icons';

function TeacherProfile(props) {
    const [userData, setUserData] = useState(null);
    const [editingPhone, setEditingPhone] = useState(false);
    const [newPhone, setNewPhone] = useState('');
    const [isValidPhone, setIsValidPhone] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('jwt');

        if (userId && token) {
            axios.get(`http://localhost:9999/user/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            .then(response => {
                setUserData(response.data);
                setNewPhone(response.data.phoneNumber || '');
            })
            .catch(error => {
                console.error("Error fetching user data:", error);
            });
        }
    }, []);

    const handleEditPhone = () => setEditingPhone(true);

    const handleConfirmSavePhone = () => setShowConfirmModal(true);

    const handleSavePhone = () => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('jwt');
    
        axios.patch(`http://localhost:9999/teacher/${userId}/phone`, { phoneNumber: newPhone }, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            if (response.data.success) {
                setUserData({ ...userData, phoneNumber: newPhone });
                setEditingPhone(false);
                setShowConfirmModal(false);
                setShowSuccessModal(true);
            }
        })
        .catch(error => {
            console.error("Error updating phone number:", error);
            alert('Có lỗi xảy ra khi cập nhật số điện thoại.');
        });
    };

    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^[0-9]{10}$/; // Adjust this regex based on your validation rules
        setIsValidPhone(phoneRegex.test(phone));
    };

    const handlePhoneChange = (e) => {
        const phone = e.target.value;
        setNewPhone(phone);
        validatePhoneNumber(phone);
    };

    return (
        <Container className="my-4">
            {userData ? (
                <Card>
                    <Card.Header as="h2" className="text-center">Thông tin người dùng</Card.Header>
                    <Card.Body>
                        <Row className="mb-3">
                            <Col xs={12} md={4} className="text-center">
                                <UserOutlined style={{ fontSize: '2rem', color: '#0d6efd' }} />
                                <p><strong>Username:</strong> {userData.username || ''}</p>
                            </Col>
                            <Col xs={12} md={4} className="text-center">
                                <MailOutlined style={{ fontSize: '2rem', color: '#0d6efd' }} />
                                <p><strong>Email:</strong> {userData.email || ''}</p>
                            </Col>
                            <Col xs={12} md={4} className="text-center">
    <PhoneOutlined style={{ fontSize: '2rem', color: '#0d6efd' }} />
    <InputGroup className="justify-content-center align-items-center">
        {editingPhone ? (
            <>
                <Form.Control
                    type="text"
                    value={newPhone}
                    onChange={handlePhoneChange}
                    isInvalid={!isValidPhone}
                />
                <Button variant="primary" onClick={handleConfirmSavePhone} disabled={!isValidPhone}>
                    <CheckOutlined />
                </Button>
                <Form.Control.Feedback type="invalid">
                    Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số.
                </Form.Control.Feedback>
            </>
        ) : (
            <>
                <p className="mb-0"><strong>Phone:</strong> {userData.phoneNumber || ''}</p>
                <Button variant="link" onClick={handleEditPhone} className="ms-2">
                    <EditOutlined />
                </Button>
            </>
        )}
    </InputGroup>
</Col>

                        </Row>

                    </Card.Body>
                </Card>
            ) : (
                <div className="text-center">
                    <Spinner animation="border" role="status" variant="primary" />
                    <p>Loading user data...</p>
                </div>
            )}

            {/* Confirm Phone Update Modal */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận cập nhật</Modal.Title>
                </Modal.Header>
                <Modal.Body>Bạn có chắc chắn muốn cập nhật số điện thoại?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="primary" onClick={handleSavePhone}>
                        Xác nhận
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Success Modal */}
            <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Thành công</Modal.Title>
                </Modal.Header>
                <Modal.Body>Cập nhật số điện thoại thành công!</Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setShowSuccessModal(false)}>
                        Đóng
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default TeacherProfile;
