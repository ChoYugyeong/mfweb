// netlify/functions/auth.js
const crypto = require('crypto');

// 환경 변수에서 비밀번호 해시 가져오기
const PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 
  // 'no1replaceU'의 SHA256 해시
  'f7c3911e02a2028eb972367f4253d71697fa0fb2803cbc6c92cd5668a7c8f4dc';

// 세션 저장소 (실제로는 Redis나 데이터베이스 사용 권장)
const sessions = new Map();

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { action, password, token } = JSON.parse(event.body);

    switch (action) {
      case 'login':
        return handleLogin(password, headers);
      
      case 'verify':
        return handleVerify(token, headers);
      
      case 'logout':
        return handleLogout(token, headers);
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

function handleLogin(password, headers) {
  if (!password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Password required' })
    };
  }

  // 비밀번호 해시 비교
  const inputHash = crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');

  if (inputHash !== PASSWORD_HASH) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid password' })
    };
  }

  // 세션 토큰 생성
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간

  // 세션 저장
  sessions.set(token, {
    createdAt: new Date(),
    expiresAt
  });

  // 오래된 세션 정리
  cleanupSessions();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      token,
      expiresAt
    })
  };
}

function handleVerify(token, headers) {
  if (!token) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Token required' })
    };
  }

  const session = sessions.get(token);
  
  if (!session || new Date() > session.expiresAt) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ valid: false })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ valid: true })
  };
}

function handleLogout(token, headers) {
  if (token) {
    sessions.delete(token);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true })
  };
}

function cleanupSessions() {
  const now = new Date();
  for (const [token, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(token);
    }
  }
}