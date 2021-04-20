import React, { Fragment, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Redirect } from "react-router-dom";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { getBoard, moveCard, moveList } from "../redux/action/board";
import { CircularProgress, Box } from "@material-ui/core";
import BoardTitle from "../board/BoardTitle.js";
import List from "../list/List";
import CreateList from "../board/CreateList";
import Members from "../board/Members";
import Navbar from "../functions/Navbar";
import BackgroundButton from "../functions/BackgroundButton";
import { Link } from "react-router-dom";

const Board = ({ match }) => {
	const board = useSelector((state) => state.board.board);
	const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
	const dispatch = useDispatch();
	// will get warning if without dispatch
	useEffect(() => {
		dispatch(getBoard(match.params.id));
	}, [dispatch, match.params.id]);

	if (!isAuthenticated) {
		return <Redirect to="/" />;
	}

	const onDragEnd = (result) => {
		const { source, destination, draggableId, type } = result;
		if (!destination) {
			return;
		}
		if (type === "card") {
			dispatch(
				moveCard(draggableId, {
					fromId: source.droppableId,
					toId: destination.droppableId,
					toIndex: destination.index,
				})
			);
		} else {
			dispatch(moveList(draggableId, { toIndex: destination.index }));
		}
	};

	return !board ? (
		<Fragment>
			<Navbar />
			<Box className="board-loading">
				<CircularProgress />
			</Box>
		</Fragment>
	) : (
		<div
			className="board-and-navbar"
			style={{
				backgroundImage:
					"url(" +
					(board.backgroundURL
						? board.backgroundURL
						: "https://source.unsplash.com/featured/?views&auto=format&fit=crop&w=2689&q=80") +
					")",
			}}
		>
			<Navbar />
			<section className="board">
				<BackgroundButton board={board} />
				<nav>
					<Link to={`/board/${board._id}/chat`}>Chat</Link>
				</nav>
				<nav>
					<Link to={`/board/${board._id}/gantt_chart`}>ganttchart</Link>
				</nav>
				<div className="board-top">
					<div className="board-top-left">
						<BoardTitle board={board} />
						<Members />
					</div>
				</div>
				<DragDropContext onDragEnd={onDragEnd}>
					<Droppable droppableId="all-lists" direction="horizontal" type="list">
						{(provided) => (
							<div
								className="lists"
								ref={provided.innerRef}
								{...provided.droppableProps}
							>
								{board.lists.map((listId, index) => (
									<List key={listId} listId={listId} index={index} />
								))}
								{provided.placeholder}
								<CreateList />
							</div>
						)}
					</Droppable>
				</DragDropContext>
			</section>
		</div>
	);
};

export default Board;
