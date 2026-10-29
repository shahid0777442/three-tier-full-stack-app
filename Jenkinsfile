/ --------------------------------------------------------------------------
// Jenkinsfile - Build -> Push to ECR -> Update docker-compose.yml -> Deploy
// Repo: https://github.com/shahid0777442/three-tier-full-stack-app.git
// Services: mongo (image from Docker Hub), backend, frontend (built here)
// ---------------------------------------------------------------------------

// Services built from this repo (folder name = service name)
def SERVICES = ['backend', 'frontend']

// Filled in by the "Locate Dockerfiles" stage
def BUILD_CTX = [:]

// Runs a block with AWS credentials exported as env vars.
// 'aws-credentials' = ID of a "Username with password" credential in Jenkins
//   Username = AWS_ACCESS_KEY_ID, Password = AWS_SECRET_ACCESS_KEY
def withAws(Closure body) {
    withCredentials([usernamePassword(
        credentialsId: 'aws-credentials',
        usernameVariable: 'AWS_ACCESS_KEY_ID',
        passwordVariable: 'AWS_SECRET_ACCESS_KEY')]) {
        body()
    }
}

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        AWS_DEFAULT_REGION = 'us-east-1'
        AWS_ACCOUNT_ID     = '260419408312'
        ECR_REGISTRY       = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com"
        REPO_PREFIX        = 'three-tier-full-stack-app'   // ECR repos: <prefix>-backend, <prefix>-frontend
        IMAGE_TAG          = "${BUILD_NUMBER}"
        COMPOSE_FILE_PATH  = 'docker-compose.yml'
    }

    stages {

        stage('Clone the Repo') {
            steps {
                git branch: 'main', url: 'https://github.com/shahid0777442/three-tier-full-stack-app.git'
                sh 'echo "Workspace: $(pwd)" && ls -la'
            }
        }

        stage('Locate Dockerfiles') {
            steps {
                script {
                    SERVICES.each { svc ->
                        def found = sh(
                            returnStdout: true,
                            script: """find . -ipath "*/${svc}/Dockerfile" -not -path "./.git/*" | head -n 1"""
                        ).trim()

                        if (!found) {
                            sh 'echo "---- Repo layout ----"; find . -not -path "./.git/*" -maxdepth 3 | sort'
                            error "No Dockerfile found for '${svc}'. Expected ./${svc}/Dockerfile"
                        }

                        BUILD_CTX[svc] = [dir: found.replaceAll('/Dockerfile$', ''), file: found]
                        echo "${svc}: Dockerfile = ${found} | context = ${BUILD_CTX[svc].dir}"
                    }
                }
            }
        }

        stage('Login to ECR') {
            steps {
                script {
                    withAws {
                        sh '''
                            aws sts get-caller-identity
                            aws ecr get-login-password --region $AWS_DEFAULT_REGION \
                              | docker login --username AWS --password-stdin $ECR_REGISTRY
                        '''
                        // Create ECR repositories if they don't exist yet
                        SERVICES.each { svc ->
                            sh """
                                aws ecr describe-repositories --repository-names ${REPO_PREFIX}-${svc} >/dev/null 2>&1 \
                                || aws ecr create-repository --repository-name ${REPO_PREFIX}-${svc} >/dev/null
                            """
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    SERVICES.each { svc ->
                        def ctx   = BUILD_CTX[svc]
                        def image = "${ECR_REGISTRY}/${REPO_PREFIX}-${svc}"
                        sh "docker build -f ${ctx.file} -t ${image}:${IMAGE_TAG} -t ${image}:latest ${ctx.dir}"
                    }
                }
            }
        }

        stage('Push Images to ECR') {
            steps {
                script {
                    withAws {
                        SERVICES.each { svc ->
                            def image = "${ECR_REGISTRY}/${REPO_PREFIX}-${svc}"
                            sh "docker push ${image}:${IMAGE_TAG}"
                            sh "docker push ${image}:latest"
                        }
                    }
                }
            }
        }

        stage('Clean up after push') {
            steps {
                script {
                    SERVICES.each { svc ->
                        def image = "${ECR_REGISTRY}/${REPO_PREFIX}-${svc}"
                        sh "docker rmi ${image}:${IMAGE_TAG} ${image}:latest || true"
                    }
     OA               sh 'docker image prune -f || true'
                }
    A        }
  OA      }

        stage('Update docker-compose.yml') {
            steps {
                script {
                    if (!fileExists(COMPOSE_FILE_PATH)) {
                        error "${COMPOSE_FILE_PATH} not found in the repo root."
                    }
                    SERVICES.each { svc ->
                        def image = "${ECR_REGISTRY}/${REPO_PREFIX}-${svc}:${IMAGE_TAG}"
                        // 1) "build: ./<svc>"  ->  "image: <ECR image>:<tag>"
                        // 2) existing "image: ...<prefix>-<svc>..." -> new tag
                        sh """
                            sed -i -E \\
                              -e 's|^([[:space:]]*)build:[[:space:]]*\\./${svc}[[:space:]]*\$|\\1image: ${image}|' \\
                              -e 's|^([[:space:]]*image:[[:space:]]*).*${REPO_PREFIX}-${svc}.*\$|\\1${image}|' \\
                              ${COMPOSE_FILE_PATH}
                        """
                        // Fail early if the replacement did not happen
                        sh "grep -q '${image}' ${COMPOSE_FILE_PATH}"
                    }
                    sh "echo '---- ${COMPOSE_FILE_PATH} ----' && cat ${COMPOSE_FILE_PATH}"
                }
            }
        }

        stage('Run with Docker Compose') {
            steps {
                script {
                    withAws {
                        sh '''
                            if docker compose version >/dev/null 2>&1; then
                                DC="docker compose"
                            else
                                DC="docker-compose"
                            fi

 A                           aws ecr get-login-password --region $AWS_DEFAULT_REGION \
                              | docker login --username AWS --password-stdin $ECR_REGISTRY

                            $DC -f $COMPOSE_FILE_PATH pull
                            $DC -f $COMPOSE_FILE_PATH up -d --remove-orphans
                            sleep 10
                            $DC -f $COMPOSE_FILE_PATH ps
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
           echo "✅ Deployment successful. Images tagged :${IMAGE_TAG} are running."
        }
        failure {
            echo '❌ Deployment failed. Please check logs.'
        }
        always {
            sh 'docker logout $ECR_REGISTRY || true'
       }
    }
}

