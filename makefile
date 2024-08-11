build:
	docker compose up --build

up:
	docker compose up

down:
	docker compose down

fclean:
	docker rm $(docker ps -qa) && docker rmi $(docker images -q) && docker volume rm $(docker volume ls -q)

test:
	docker compose run --rm app go test -v ./...