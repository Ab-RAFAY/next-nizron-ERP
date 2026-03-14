'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, message, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    const result = await login(values.email, values.password);
    setLoading(false);

    if (!result.success) {
      message.error(result.error || 'Login failed');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
      }}
    >
      <Card
        style={{
          width: 360,
          boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
          borderRadius: 8,
          border: 'none',
        }}
        bodyStyle={{ padding: '28px 32px' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              borderRadius: 8,
              padding: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: 12,
              width: 72,
              height: 72,
              overflow: 'hidden',
            }}
          >
            <img
              src="/images/images.png"
              alt="Nizron Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1f1f1f', margin: 0 }}>Nizron ERP</h1>
          <p style={{ fontSize: 12, color: '#8c8c8c', margin: '4px 0 0' }}>Management System</p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="middle"
          initialValues={{ email: 'admin@nizron.com', password: 'password123' }}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Email address"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
            style={{ marginBottom: 16 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 36, fontWeight: 500 }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '16px 0', borderColor: '#f0f0f0' }} />
        <div style={{ textAlign: 'center', fontSize: 11, color: '#bfbfbf' }}>
          <p style={{ margin: 0 }}>admin@nizron.com / password123</p>
        </div>
      </Card>
    </div>
  );
}
