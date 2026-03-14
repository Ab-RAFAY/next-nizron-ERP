import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App } from "antd";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nizron - Management System",
  description: "Enterprise ERP Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#1677ff",
                colorSuccess: "#52c41a",
                colorWarning: "#faad14",
                colorError: "#ff4d4f",
                colorBgContainer: "#ffffff",
                colorBgLayout: "#f5f5f5",
                borderRadius: 4,
                fontSize: 13,
                fontFamily:
                  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              },
              components: {
                Table: {
                  headerBg: "#fafafa",
                  headerColor: "#595959",
                  rowHoverBg: "#f0f7ff",
                  cellPaddingBlock: 7,
                  cellPaddingInline: 12,
                  headerSplitColor: "#f0f0f0",
                },
                Menu: {
                  darkItemBg: "#001529",
                  darkSubMenuItemBg: "#000c17",
                  itemMarginBlock: 1,
                  itemPaddingInline: 14,
                },
                Button: {
                  controlHeight: 30,
                  borderRadius: 4,
                  fontSize: 13,
                },
                Card: {
                  paddingLG: 16,
                  headerFontSize: 14,
                },
                Input: {
                  controlHeight: 32,
                  fontSize: 13,
                },
                Select: {
                  controlHeight: 32,
                  fontSize: 13,
                },
                DatePicker: {
                  controlHeight: 32,
                  fontSize: 13,
                },
                Modal: {
                  titleFontSize: 15,
                },
                Form: {
                  itemMarginBottom: 14,
                  labelFontSize: 12,
                },
                Statistic: {
                  titleFontSize: 12,
                  contentFontSize: 24,
                },
                Tag: {
                  fontSize: 11,
                },
                Badge: {
                  fontSize: 11,
                },
                Typography: {
                  fontSize: 13,
                  fontSizeHeading1: 28,
                  fontSizeHeading2: 22,
                  fontSizeHeading3: 18,
                  fontSizeHeading4: 16,
                  fontSizeHeading5: 14,
                },
              },
            }}
          >
            <App>
              <AuthProvider>{children}</AuthProvider>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
