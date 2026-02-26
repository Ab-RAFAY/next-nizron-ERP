'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, ShopOutlined } from '@ant-design/icons';
import { ClientAuthProvider, useClientAuth } from '@/lib/client-auth';

function ClientLoginForm() {
  const [loading, setLoading] = useState(false);
  const { login } = useClientAuth();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    const result = await login(values.email, values.password);
    setLoading(false);

    if (!result.success) {
      message.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-xl border-0">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg flex items-center justify-center w-20 h-20">
              <ShopOutlined style={{ fontSize: 36, color: 'white' }} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Client Portal</h1>
          <p className="text-gray-500 mt-1">Nizron ERP - Client Access</p>
        </div>

        <Form
          name="client-login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Client Email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                borderColor: 'transparent',
                height: 48,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Sign In as Client
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center">
          <a href="/login" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            Admin Login &rarr;
          </a>
        </div>
      </Card>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <ClientAuthProvider>
      <ClientLoginForm />
    </ClientAuthProvider>
  );
}
