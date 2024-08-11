build:
	docker compose up --build

up:
	docker compose up

down:
	docker compose down

fclean:
	docker rm $(docker ps -qa) && docker rmi $(docker images -q) && docker volume rm $(docker volume ls -q)

migrate:
	docker compose run backend python manage.py migrate