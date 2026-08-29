# Tài liệu triển khai dự án Cat Learning Hub

## 1. Tổng quan dự án

Cat Learning Hub là nền tảng học tập cộng đồng tập trung vào tính kỷ luật, trách nhiệm và động lực học tập. Dựa trên các tính năng nổi bật trong ảnh tham khảo, sản phẩm sẽ kết hợp:

- Không gian học tập theo nhóm hoặc phòng học trực tuyến
- Theo dõi tiến độ và mục tiêu cá nhân
- Hệ thống cam kết và đặt cược để tăng độ bền vững
- Hệ thống thưởng, leaderboard và gamification
- Xác minh tiến độ học tập bằng hình thức kiểm tra hoặc báo cáo
- Cộng đồng hỗ trợ và chia sẻ tiến độ

Dự án này hướng đến người học ở độ tuổi sinh viên, người đi làm tự học, và các nhóm học tập nhỏ cần động lực và trách nhiệm trong quá trình học.

---

## 2. Vấn đề và cơ hội

### 2.1 Vấn đề người dùng gặp phải

- Khó duy trì thói quen học tập đều đặn
- Thiếu động lực khi học một mình
- Không có nhóm học tập thực sự để chịu trách nhiệm
- Dễ bỏ cuộc khi không có phản hồi hoặc xác nhận
- Khó đo lường tiến độ và quản lý mục tiêu học tập

### 2.2 Cơ hội thị trường

Dựa trên các sản phẩm tham khảo trong ảnh, thị trường đang có xu hướng phát triển theo hướng:

- học tập cộng đồng + room học trực tuyến
- accountability và social commitment
- reward / stake / leaderboard
- gamification để duy trì tiến độ

### 2.3 Giá trị cốt lõi

Nền tảng này mang lại ba giá trị chính:

1. Tăng tính kỷ luật: Người dùng có lịch học, nhóm, cam kết, và phản hồi mỗi ngày.
2. Tăng động lực: Hệ thống thưởng, tình trạng cộng đồng, leaderboard, và tiến độ rõ ràng.
3. Tăng hiệu quả: Học theo nhóm giúp giảm sự trì hoãn và tạo cảm giác có người theo dõi.

---

## 3. Người dùng mục tiêu

### 3.1 Nhóm người dùng chính

- Học sinh, sinh viên tự học
- Người đi làm học kỹ năng mới
- Nhóm học cùng nhau để thi, luyện tập hoặc nâng cao kỹ năng
- Người cần hệ thống trách nhiệm để duy trì thói quen học tập

### 3.2 Persona chính

#### Persona A: Sinh viên tự kỷ luật

- Muốn học đều đặn nhưng thiếu động lực
- Cần nhóm học để tạo áp lực tích cực
- Ưu tiên chức năng focus room và lịch học

#### Persona B: Học nhóm

- Học theo kế hoạch chung
- Cần giao tiếp, chia sẻ tiến độ và cùng nhau theo dõi
- Ưu tiên room học, cộng đồng, dashboard tiến độ

#### Persona C: Người học dựa trên cam kết

- Tự đặt mục tiêu nhưng cần hệ thống kỷ luật mạnh hơn
- Thích các hình thức stake, reward, pledge
- Ưu tiên gamification, leaderboard, reward pool

---

## 4. Tính năng MVP

### 4.1 Tính năng cốt lõi

#### a. Study room / video room

- Tạo phòng học 1-1 hoặc nhóm
- Mời người dùng tham gia
- Chế độ focus session với đồng hồ bấm giờ
- Nhắn tin nhanh trong phòng học

#### b. Group / Class / Community

- Tạo nhóm học theo chủ đề, khóa học hoặc mục tiêu
- Mời thành viên
- Giao diện tiến độ của cả nhóm
- Chia nhóm theo mục tiêu và thời gian học

#### c. Goal + tracking

- Người dùng tạo mục tiêu học tập
- Gán thời gian học, chủ đề, deadline
- Theo dõi trạng thái hoàn thành theo ngày/tuần
- Cảnh báo khi tiến độ chậm

#### d. Commitment / stake

- Người dùng đặt cam kết học tập
- Có thể gắn stake bằng điểm, quà tặng, hoặc tiền ảo
- Tự tạo rule về vi phạm: không học, không hoàn thành mục tiêu

#### e. Reward pool

- Quỹ thưởng tích lũy từ người dùng hoặc nền tảng
- Trao thưởng cho người đạt tiến độ tốt hoặc hoàn thành cam kết
- Có thể chia theo nhóm hoặc cá nhân

#### f. Verify submission / check-in

- Người dùng check-in sau mỗi buổi học
- Xác minh bằng ảnh, văn bản, hoặc mục tiêu hoàn thành
- Có thể được đánh giá bởi mentor, admin hoặc nhóm

#### g. Gamification

- Điểm XP, level, badge
- Leaderboard theo tuần/tháng
- Thưởng, streak, achievement

### 4.2 Tính năng nâng cao

- AI gợi ý lịch học dựa trên thói quen
- Tự động đánh giá tiến độ
- Mời bạn bè tham gia phòng học
- Bảng xếp hạng theo nhóm và cá nhân
- Thông báo push / email nhắc nhở

---

## 5. Kiến trúc hệ thống

### 5.1 Mô hình tổng quan

Hệ thống nên được triển khai theo kiến trúc web app hiện đại với các tầng sau:

- Frontend: React hoặc Next.js
- Backend: Node.js + NestJS hoặc Next.js API routes
- Database: PostgreSQL
- Real-time communication: WebSocket / Socket.IO
- Cache: Redis
- Storage: S3-compatible object storage (ảnh, video, file check-in)
- Notification: Firebase Cloud Messaging hoặc SendGrid
- Authentication: Auth provider như Clerk, Supabase Auth, hoặc JWT custom

### 5.2 Thành phần hệ thống

#### Frontend

- Trang landing
- Dashboard cá nhân
- Study room
- Group management
- Goal planner
- Leaderboard
- Reward center

#### Backend

- User management
- Group management
- Session tracking
- Goal and streak logic
- Commitment / stake engine
- Reward and payout logic
- Notification service
- Verification workflow

#### Realtime layer

- Hỗ trợ room join/leave
- Thông báo trạng thái online
- Chat và cập nhật tiến độ thời gian thực
- Leaderboard realtime

### 5.3 Luồng nghiệp vụ chính

#### Luồng 1: Tạo nhóm và học cùng nhau

1. User tạo nhóm
2. User mời người khác
3. Người dùng đặt mục tiêu học tập chung
4. Hệ thống tạo session schedule
5. Mỗi thành viên check-in và theo dõi quá trình

#### Luồng 2: Cam kết và thưởng

1. User tạo commitment
2. Chọn stake/rule
3. Hệ thống lưu trong database
4. Mỗi buổi học cập nhật tiến độ
5. Nếu vi phạm, stake bị trừ hoặc cộng đồng xác nhận
6. Reward pool phân phối theo điều kiện

#### Luồng 3: Focus session

1. User vào room học
2. Bắt đầu focus timer
3. Tham gia đồng thời với nhóm
4. Tự động log session
5. Hệ thống cập nhật streak và XP

---

## 6. Thiết kế dữ liệu

### 6.1 Entitites chính

- User
- Group
- Membership
- Goal
- Session
- CheckIn
- Commitment
- RewardPool
- LeaderboardEntry
- Notification
- Achievement

### 6.2 Mối quan hệ cơ bản

- User có nhiều Group qua Membership
- Group có nhiều Goal và Session
- Goal thuộc về User hoặc Group
- Session được liên kết với User, Group, Goal
- CheckIn thuộc về User và Session
- Commitment thuộc về User và được đánh giá theo Goal

### 6.3 Ví dụ schema gợi ý

#### User

- id
- name
- email
- avatar
- role
- level
- xp
- streak
- createdAt

#### Goal

- id
- userId
- groupId (nullable)
- title
- description
- targetType
- deadline
- status
- progress

#### Session

- id
- userId
- groupId
- goalId
- startedAt
- endedAt
- durationMinutes
- verified

#### Commitment

- id
- userId
- groupId
- amount
- rule
- penalty
- status

---

## 7. Giao diện người dùng đề xuất

### 7.1 Trang chủ

- Hero section giới thiệu giá trị cốt lõi
- Chỉ dẫn hành động: Bắt đầu học, tạo nhóm, xem demo
- Chứng thực tính năng nổi bật

### 7.2 Dashboard

- Thống kê hôm nay: buổi học, streak, mục tiêu
- Kế hoạch học trong tuần
- Xếp hạng và điểm XP
- Danh sách nhắc nhở và check-in

### 7.3 Study room

- Video/call room
- Timer học
- Chat trong phòng
- Status online và hoạt động của thành viên

### 7.4 Leaderboard / Gamification

- Top người dùng trong tuần
- Badge/achievement
- Dựa trên điểm, streak, và thời gian học

---

## 8. Kế hoạch phát triển

### Giai đoạn 1: MVP (2-4 tuần)

- Auth và profile
- Tạo nhóm, ghép nhóm
- Goal management
- Focus timer / session log
- Check-in và streak
- Dashboard cơ bản

### Giai đoạn 2: Social + accountability (3-5 tuần)

- Study room / video or live room
- Group chat
- Commitment / stake engine
- Notification
- Reward pool
- Moderator tools

### Giai đoạn 3: Gamification và retention (2-4 tuần)

- Leaderboard
- Achievement
- Daily challenge
- Bảng xếp hạng theo nhóm
- AI nhắc nhở lịch học

### Giai đoạn 4: Scale + monetization (tùy chọn)

- Team plans
- Premium subscription
- Paid challenge room
- Mentor role và coach marketplace
- Analytics và reporting

---

## 9. Mốc triển khai

### Mốc 1: Khảo sát và định hình

- Xác định mục tiêu người dùng
- Chốt tính năng MVP
- Final UI flow
- Phân tích cạnh tranh

### Mốc 2: Thiết kế hệ thống

- Sitemap
- Wireframe
- Database schema
- API contract
- Deployment plan

### Mốc 3: Development

- Frontend cơ bản
- Backend cơ bản
- Auth và DB
- Real-time room
- Goal tracking

### Mốc 4: Beta test

- Tạo nhóm thử nghiệm
- Test với 10-30 user
- Thu thập phản hồi
- Chỉnh sửa UX

### Mốc 5: Launch

- Production deployment
- Marketing tích hợp
- Cơ chế onboarding
- Theo dõi KPI

---

## 10. KPI và thành công

### KPI product

- Số lượng user hoạt động hàng ngày
- Tỷ lệ hoàn thành goal
- Số session trung bình mỗi user
- Tỷ lệ user quay lại sau 7 ngày
- Tỷ lệ tham gia room nhóm
- Tỷ lệ hoàn thành commitment

### KPI kinh doanh

- Tỷ lệ giữ chân user
- Tỷ lệ chuyển đổi từ free sang premium
- Số lượng nhóm học tạo mới
- Số nhóm hoạt động ổn định

---

## 11. Rủi ro và giải pháp

### Rủi ro 1: Người dùng không duy trì thói quen

Giải pháp:
- Hệ thống nhắc nhở tự động
- Tạo nhóm theo mục tiêu nhỏ
- Tích hợp streak và reward

### Rủi ro 2: Sự phụ thuộc vào video call

Giải pháp:
- Tạo ra các chế độ học không cần camera
- Hỗ trợ chat + focus timer + check-in

### Rủi ro 3: Người dùng sợ mất tiền hoặc mất quyền riêng tư

Giải pháp:
- Thấp rõ rule của commitment
- Quy định về dữ liệu, quyền kiểm soát, và moderation

### Rủi ro 4: Chưa có kiểm soát phản hồi

Giải pháp:
- Tạo quyền report, verify, mod tools
- Có cơ chế công khai hoặc private group

---

## 12. Đề xuất công nghệ gợi ý

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Zustand hoặc React Query

### Backend

- NestJS hoặc Next.js API
- Prisma ORM
- PostgreSQL
- Redis

### Real-time / Chat

- Socket.IO hoặc Supabase realtime
- WebRTC nếu cần video call trực tiếp

### Deploy

- Vercel (frontend)
- Railway / Render / AWS ECS (backend)
- Supabase hoặc managed PostgreSQL
- Cloudflare + CDN

---

## 13. Đề xuất mấu chốt về chiến lược phát triển

Để có thể đi vào thị trường, dự án nên ưu tiên xây dựng đúng – không cần làm quá sớm tất cả tính năng trong ảnh. Tập trung theo nguyên tắc:

1. Tạo cảm giác cùng học và được theo dõi
2. Tăng tỷ lệ hoàn thành bằng check-in và streak
3. Thêm động lực bằng reward và leaderboard
4. Chỉ mở rộng stake / gamification khi có user thật và engagement đã ổn

Điều này giúp dự án vừa có giá trị, vừa tránh phát triển quá nhiều tính năng trước khi kiểm chứng thị trường.

---

## 14. Kết luận

Cat Learning Hub có tiềm năng trở thành nền tảng học tập cộng đồng kiểu accountability + focus + gamification. Từ ảnh tham khảo, mô hình thành công nằm ở việc kết hợp:

- room học tập
- mục tiêu và tracking
- trách nhiệm cộng đồng
- thưởng và leaderboard
- xác minh tiến độ

Nếu xây dựng đúng khung MVP, dự án đủ khả năng thu hút người học cần kỷ luật và động lực, đồng thời dễ mở rộng thành sản phẩm bền vững trong dài hạn.

---

## 15. Bản kế hoạch triển khai ngắn gọn

### Tuần 1-2

- Khảo sát user
- Chốt MVP
- Wireframe
- Database schema

### Tuần 3-5

- Xây dựng auth, profile, dashboard
- Goal + session tracking
- Group creation

### Tuần 6-8

- Study room
- Check-in và verification
- Notifications
- Leaderboard

### Tuần 9-10

- Beta test
- Bugfix
- Tối ưu onboarding
- Launch

---

## 16. Gợi ý tên sản phẩm

Một số tên gợi ý:

- Cat Study Hub

Trong trường hợp cần một tên rõ ràng và dễ thương cho cộng đồng học tập, "Cat Learning Hub" là tên mạnh mẽ và dễ nhận diện trong bối cảnh này.
