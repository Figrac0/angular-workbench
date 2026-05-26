import { Component, Input } from '@angular/core';
import { TaskComponent } from './task/task.component';
import { NewTaskComponent } from './new-task/new-task.component';

import { NewTaskData } from './task/task.model';
import { TasksService } from './tasks.service';
import { NgClass } from '../../../node_modules/@angular/common/index';

@Component({
  selector: 'app-tasks',
  standalone: true,
  templateUrl: './tasks.component.html',
  styleUrl: './tasks.component.css',
  imports: [TaskComponent, NewTaskComponent],
})
export class TasksComponent {
  @Input({ required: true }) userId!: string;
  @Input({ required: true }) name?: string;

  isAddingTask = false;

  // private tasksService: TasksService;

  constructor(private tasksService: TasksService) {
    // this.tasksService = tasksService;
  }

  get selectedUSerTasks() {
    return this.tasksService.getUserTasks(this.userId);
  }

  // onCompleteTask(id: string) {}

  onNewTask() {
    this.isAddingTask = true;
  }

  onCloselAddTask() {
    this.isAddingTask = false;
  }

  onAddTask(taskData: NewTaskData) {
    this.isAddingTask = false;
  }
}
