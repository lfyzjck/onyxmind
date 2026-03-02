/**
 * SessionManager 单元测试
 * 基于 SDK 测试结果编写
 */

import { createOpencodeClient } from '@opencode-ai/sdk/client';

const BASE_URL = 'http://127.0.0.1:4096';
const TEST_DIRECTORY = '/Users/jiachengkun/projects/onyxmind';

// Mock OpencodeService
class MockOpencodeService {
	constructor() {
		this.client = createOpencodeClient({ baseUrl: BASE_URL });
	}

	async createSession(title) {
		const response = await this.client.session.create({
			body: { title: title || 'Test Session' },
			query: { directory: TEST_DIRECTORY }
		});

		// 基于 SDK 测试结果: response.data 是对象
		if ('data' in response && response.data && typeof response.data === 'object') {
			if ('id' in response.data) {
				return response.data.id;
			}
		}
		return null;
	}

	async deleteSession(id) {
		const response = await this.client.session.delete({
			path: { id }
		});
		// 基于 SDK 测试结果: response.data 是 true
		return response.data === true;
	}
}

// SessionManager 实现（从源码复制）
class SessionManager {
	constructor(opencodeService) {
		this.sessions = new Map();
		this.activeSessionId = null;
		this.opencodeService = opencodeService;
	}

	async createSession(title) {
		const sessionId = await this.opencodeService.createSession(title);

		if (!sessionId) {
			return null;
		}

		const session = {
			id: sessionId,
			title: title || `Session ${this.sessions.size + 1}`,
			messages: [],
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		this.sessions.set(sessionId, session);
		this.activeSessionId = sessionId;

		return session;
	}

	getSession(id) {
		return this.sessions.get(id);
	}

	getActiveSession() {
		if (!this.activeSessionId) {
			return null;
		}
		return this.sessions.get(this.activeSessionId) || null;
	}

	setActiveSession(id) {
		if (this.sessions.has(id)) {
			this.activeSessionId = id;
			return true;
		}
		return false;
	}

	async deleteSession(id) {
		const session = this.sessions.get(id);
		if (!session) {
			return false;
		}

		await this.opencodeService.deleteSession(id);
		this.sessions.delete(id);

		if (this.activeSessionId === id) {
			this.activeSessionId = null;
		}

		return true;
	}

	getAllSessions() {
		return Array.from(this.sessions.values())
			.sort((a, b) => b.updatedAt - a.updatedAt);
	}

	addMessage(sessionId, message) {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.messages.push(message);
			session.updatedAt = Date.now();
		}
	}

	updateSessionTitle(sessionId, title) {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.title = title;
			session.updatedAt = Date.now();
		}
	}

	clearSessionMessages(sessionId) {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.messages = [];
			session.updatedAt = Date.now();
		}
	}

	toJSON() {
		const data = {
			sessions: Array.from(this.sessions.entries()),
			activeSessionId: this.activeSessionId
		};
		return JSON.stringify(data);
	}

	fromJSON(json) {
		try {
			const data = JSON.parse(json);
			this.sessions = new Map(data.sessions);
			this.activeSessionId = data.activeSessionId;
		} catch (error) {
			console.error('Failed to load sessions:', error);
		}
	}

	getSessionCount() {
		return this.sessions.size;
	}
}

// 测试套件
class SessionManagerTest {
	constructor() {
		this.service = new MockOpencodeService();
		this.manager = new SessionManager(this.service);
		this.testSessionIds = [];
	}

	async test1_CreateSession() {
		console.log('\n=== 测试 1: 创建会话 ===');

		const session = await this.manager.createSession('Test Session 1');

		if (!session) {
			console.error('❌ 创建会话失败');
			return false;
		}

		console.log('✅ 会话创建成功:', {
			id: session.id,
			title: session.title,
			messages: session.messages.length
		});

		this.testSessionIds.push(session.id);

		// 验证会话存储
		const retrieved = this.manager.getSession(session.id);
		if (!retrieved) {
			console.error('❌ 无法检索创建的会话');
			return false;
		}

		console.log('✅ 会话检索成功');

		// 验证活动会话
		const active = this.manager.getActiveSession();
		if (!active || active.id !== session.id) {
			console.error('❌ 活动会话设置失败');
			return false;
		}

		console.log('✅ 活动会话设置正确');
		return true;
	}

	async test2_CreateMultipleSessions() {
		console.log('\n=== 测试 2: 创建多个会话 ===');

		const session2 = await this.manager.createSession('Test Session 2');
		const session3 = await this.manager.createSession('Test Session 3');

		if (!session2 || !session3) {
			console.error('❌ 创建多个会话失败');
			return false;
		}

		this.testSessionIds.push(session2.id, session3.id);

		const count = this.manager.getSessionCount();
		console.log('✅ 会话总数:', count);

		if (count !== 3) {
			console.error('❌ 会话数量不正确，期望 3，实际', count);
			return false;
		}

		// 验证最后创建的是活动会话
		const active = this.manager.getActiveSession();
		if (!active || active.id !== session3.id) {
			console.error('❌ 活动会话应该是最后创建的');
			return false;
		}

		console.log('✅ 多会话创建成功');
		return true;
	}

	async test3_AddMessages() {
		console.log('\n=== 测试 3: 添加消息 ===');

		const session = this.manager.getActiveSession();
		if (!session) {
			console.error('❌ 没有活动会话');
			return false;
		}

		const message1 = {
			role: 'user',
			content: 'Hello',
			timestamp: Date.now()
		};

		const message2 = {
			role: 'assistant',
			content: 'Hi there!',
			timestamp: Date.now()
		};

		this.manager.addMessage(session.id, message1);
		this.manager.addMessage(session.id, message2);

		const updated = this.manager.getSession(session.id);
		if (!updated || updated.messages.length !== 2) {
			console.error('❌ 消息添加失败');
			return false;
		}

		console.log('✅ 消息添加成功:', updated.messages.length, '条消息');
		return true;
	}

	async test4_UpdateTitle() {
		console.log('\n=== 测试 4: 更新标题 ===');

		const session = this.manager.getActiveSession();
		if (!session) {
			console.error('❌ 没有活动会话');
			return false;
		}

		const newTitle = 'Updated Title';
		this.manager.updateSessionTitle(session.id, newTitle);

		const updated = this.manager.getSession(session.id);
		if (!updated || updated.title !== newTitle) {
			console.error('❌ 标题更新失败');
			return false;
		}

		console.log('✅ 标题更新成功:', updated.title);
		return true;
	}

	async test5_ClearMessages() {
		console.log('\n=== 测试 5: 清空消息 ===');

		const session = this.manager.getActiveSession();
		if (!session) {
			console.error('❌ 没有活动会话');
			return false;
		}

		this.manager.clearSessionMessages(session.id);

		const updated = this.manager.getSession(session.id);
		if (!updated || updated.messages.length !== 0) {
			console.error('❌ 消息清空失败');
			return false;
		}

		console.log('✅ 消息清空成功');
		return true;
	}

	async test6_SwitchActiveSession() {
		console.log('\n=== 测试 6: 切换活动会话 ===');

		const sessions = this.manager.getAllSessions();
		if (sessions.length < 2) {
			console.error('❌ 会话数量不足');
			return false;
		}

		const firstSession = sessions[sessions.length - 1]; // 最早的会话
		const success = this.manager.setActiveSession(firstSession.id);

		if (!success) {
			console.error('❌ 切换活动会话失败');
			return false;
		}

		const active = this.manager.getActiveSession();
		if (!active || active.id !== firstSession.id) {
			console.error('❌ 活动会话未正确切换');
			return false;
		}

		console.log('✅ 活动会话切换成功:', active.title);
		return true;
	}

	async test7_SerializeDeserialize() {
		console.log('\n=== 测试 7: 序列化和反序列化 ===');

		const json = this.manager.toJSON();
		console.log('序列化 JSON 长度:', json.length);

		const newManager = new SessionManager(this.service);
		newManager.fromJSON(json);

		if (newManager.getSessionCount() !== this.manager.getSessionCount()) {
			console.error('❌ 反序列化后会话数量不匹配');
			return false;
		}

		const originalActive = this.manager.getActiveSession();
		const restoredActive = newManager.getActiveSession();

		if (!originalActive || !restoredActive || originalActive.id !== restoredActive.id) {
			console.error('❌ 活动会话未正确恢复');
			return false;
		}

		console.log('✅ 序列化/反序列化成功');
		return true;
	}

	async test8_DeleteSession() {
		console.log('\n=== 测试 8: 删除会话 ===');

		const sessions = this.manager.getAllSessions();
		const sessionToDelete = sessions[sessions.length - 1];

		console.log('删除会话:', sessionToDelete.title);

		const success = await this.manager.deleteSession(sessionToDelete.id);
		if (!success) {
			console.error('❌ 删除会话失败');
			return false;
		}

		const retrieved = this.manager.getSession(sessionToDelete.id);
		if (retrieved) {
			console.error('❌ 会话仍然存在');
			return false;
		}

		console.log('✅ 会话删除成功');
		console.log('剩余会话数:', this.manager.getSessionCount());
		return true;
	}

	async cleanup() {
		console.log('\n=== 清理测试数据 ===');

		for (const sessionId of this.testSessionIds) {
			try {
				await this.service.deleteSession(sessionId);
				console.log('✅ 删除测试会话:', sessionId);
			} catch (error) {
				console.log('⚠️ 删除失败:', sessionId);
			}
		}
	}

	async runAllTests() {
		console.log('╔════════════════════════════════════════╗');
		console.log('║   SessionManager 单元测试开始          ║');
		console.log('╚════════════════════════════════════════╝');

		const tests = [
			this.test1_CreateSession,
			this.test2_CreateMultipleSessions,
			this.test3_AddMessages,
			this.test4_UpdateTitle,
			this.test5_ClearMessages,
			this.test6_SwitchActiveSession,
			this.test7_SerializeDeserialize,
			this.test8_DeleteSession
		];

		let passed = 0;
		let failed = 0;

		for (const test of tests) {
			try {
				const result = await test.call(this);
				if (result) {
					passed++;
				} else {
					failed++;
				}
			} catch (error) {
				console.error('❌ 测试异常:', error);
				failed++;
			}
		}

		await this.cleanup();

		console.log('\n╔════════════════════════════════════════╗');
		console.log('║   测试结果                             ║');
		console.log('╚════════════════════════════════════════╝');
		console.log(`通过: ${passed}`);
		console.log(`失败: ${failed}`);
		console.log(`总计: ${passed + failed}`);
	}
}

// 运行测试
const test = new SessionManagerTest();
test.runAllTests().catch(console.error);
