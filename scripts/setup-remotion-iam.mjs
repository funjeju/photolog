import {
  IAMClient,
  CreateRoleCommand,
  AttachRolePolicyCommand,
  PutRolePolicyCommand,
  GetRoleCommand,
} from '@aws-sdk/client-iam';

const REGION = 'ap-northeast-2';
const ROLE_NAME = 'remotion-lambda-role';

const client = new IAMClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Lambda가 이 롤을 assume할 수 있는 trust policy
const TRUST_POLICY = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { Service: 'lambda.amazonaws.com' },
      Action: 'sts:AssumeRole',
    },
  ],
});

// Remotion Lambda에 필요한 인라인 권한 policy
const INLINE_POLICY = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Action: ['s3:ListAllMyBuckets'],
      Resource: '*',
    },
    {
      Effect: 'Allow',
      Action: [
        's3:GetObject', 's3:PutObject', 's3:DeleteObject',
        's3:CreateBucket', 's3:ListBucket', 's3:GetBucketLocation',
        's3:PutBucketAcl', 's3:PutBucketOwnershipControls',
        's3:PutBucketPublicAccessBlock', 's3:GetBucketAcl',
        's3:PutObjectAcl',
      ],
      Resource: ['arn:aws:s3:::remotionlambda-*', 'arn:aws:s3:::remotionlambda-*/*'],
    },
    {
      Effect: 'Allow',
      Action: [
        'logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents',
      ],
      Resource: 'arn:aws:logs:*:*:*',
    },
    {
      Effect: 'Allow',
      Action: ['lambda:InvokeFunction'],
      Resource: 'arn:aws:lambda:*:*:function:remotion-render-*',
    },
  ],
});

async function main() {
  // 1. 롤이 이미 있는지 확인
  try {
    await client.send(new GetRoleCommand({ RoleName: ROLE_NAME }));
    console.log(`✅ 롤 "${ROLE_NAME}" 이미 존재합니다.`);
  } catch (e) {
    if (e.name === 'NoSuchEntityException') {
      // 2. 롤 생성
      console.log(`📦 롤 "${ROLE_NAME}" 생성 중...`);
      await client.send(new CreateRoleCommand({
        RoleName: ROLE_NAME,
        AssumeRolePolicyDocument: TRUST_POLICY,
        Description: 'Remotion Lambda rendering role',
      }));
      console.log('✅ 롤 생성 완료');
    } else {
      throw e;
    }
  }

  // 3. AWS 관리형 정책 붙이기
  console.log('📎 AWSLambdaBasicExecutionRole 정책 연결 중...');
  await client.send(new AttachRolePolicyCommand({
    RoleName: ROLE_NAME,
    PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }));

  // 4. 인라인 정책 붙이기
  console.log('📎 Remotion 인라인 정책 적용 중...');
  await client.send(new PutRolePolicyCommand({
    RoleName: ROLE_NAME,
    PolicyName: 'remotion-lambda-policy',
    PolicyDocument: INLINE_POLICY,
  }));

  console.log('✅ IAM 설정 완료! 이제 Lambda 배포를 진행합니다.');
}

main().catch((e) => {
  console.error('❌ 오류:', e.message);
  process.exit(1);
});
